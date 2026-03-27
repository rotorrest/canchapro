import { Hono } from "hono";
import { eq, and, lte } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const courts = new Hono<{ Bindings: Bindings; Variables: Variables }>();

courts.use("/*", authMiddleware);

// ── Helper: resolve credit cost for a given hour and date ───────────────────

function getSlot(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getDayType(date: string): "weekday" | "weekend" {
  const day = new Date(date + "T12:00:00Z").getUTCDay(); // Use noon UTC to avoid date-shift
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

// ── Courts CRUD ─────────────────────────────────────────────────────────────

// GET /courts — list all courts for tenant
courts.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const result = await db.query.courts.findMany({
    where: eq(schema.courts.tenantId, tenantId),
  });

  return c.json({ data: result });
});

// GET /courts/:id — single court
courts.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();

  const court = await db.query.courts.findFirst({
    where: and(eq(schema.courts.id, id), eq(schema.courts.tenantId, tenantId)),
  });

  if (!court) return c.json({ error: "Court not found" }, 404);
  return c.json({ data: court });
});

// POST /courts — create court
courts.post("/", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const body = await c.req.json();

  const id = crypto.randomUUID();

  await db.insert(schema.courts).values({
    id,
    tenantId,
    sedeId: body.sedeId ?? null,
    name: body.name,
    sport: body.sport ?? "padel",
    type: body.type,
    surface: body.surface,
    capacity: body.capacity ?? 4,
    isActive: true,
    createdBy: user.id,
  });

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, id) });
  return c.json({ data: court }, 201);
});

// PUT /courts/:id — update court
courts.put("/:id", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const body = await c.req.json();

  // Whitelist updatable fields to prevent overwriting id/tenantId
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.sedeId !== undefined) updates.sedeId = body.sedeId;
  if (body.sport !== undefined) updates.sport = body.sport;
  if (body.type !== undefined) updates.type = body.type;
  if (body.surface !== undefined) updates.surface = body.surface;
  if (body.capacity !== undefined) updates.capacity = body.capacity;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.courts)
      .set(updates)
      .where(and(eq(schema.courts.id, id), eq(schema.courts.tenantId, tenantId)));
  }

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, id) });
  return c.json({ data: court });
});

// ── Schedules ───────────────────────────────────────────────────────────────

// GET /courts/:id/schedule — list schedule for all days
courts.get("/:id/schedule", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const schedules = await db.query.courtSchedules.findMany({
    where: eq(schema.courtSchedules.courtId, id),
  });

  return c.json({ data: schedules });
});

// POST /courts/:id/schedule — upsert schedule for all 7 days
courts.post("/:id/schedule", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json<{
    days: Array<{
      dayOfWeek: number;
      openTime: string | null;
      closeTime: string | null;
      isClosed: boolean;
    }>;
  }>();

  if (!body.days || body.days.length !== 7) {
    return c.json({ error: "Must provide exactly 7 days (0=Monday to 6=Sunday)" }, 400);
  }

  // Upsert each day: delete existing + insert fresh
  await db.delete(schema.courtSchedules).where(eq(schema.courtSchedules.courtId, id));

  const values = body.days.map((day) => ({
    id: crypto.randomUUID(),
    courtId: id,
    dayOfWeek: day.dayOfWeek,
    openTime: day.openTime,
    closeTime: day.closeTime,
    isClosed: day.isClosed,
  }));

  await db.insert(schema.courtSchedules).values(values);

  const schedules = await db.query.courtSchedules.findMany({
    where: eq(schema.courtSchedules.courtId, id),
  });

  return c.json({ data: schedules }, 201);
});

// PUT /courts/:id/schedule/:scheduleId — update single schedule day
courts.put("/:id/schedule/:scheduleId", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const { id, scheduleId } = c.req.param();
  const body = await c.req.json();

  // Whitelist updatable fields to prevent overwriting id/courtId
  const updates: Record<string, unknown> = {};
  if (body.openTime !== undefined) updates.openTime = body.openTime;
  if (body.closeTime !== undefined) updates.closeTime = body.closeTime;
  if (body.isClosed !== undefined) updates.isClosed = body.isClosed;

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.courtSchedules)
      .set(updates)
      .where(
        and(
          eq(schema.courtSchedules.id, scheduleId),
          eq(schema.courtSchedules.courtId, id)
        )
      );
  }

  const schedule = await db.query.courtSchedules.findFirst({
    where: eq(schema.courtSchedules.id, scheduleId),
  });

  if (!schedule) return c.json({ error: "Schedule not found" }, 404);
  return c.json({ data: schedule });
});

// ── Blocks ──────────────────────────────────────────────────────────────────

// GET /courts/:id/blocks — list blocks for a court
courts.get("/:id/blocks", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const blocks = await db.query.courtBlocks.findMany({
    where: eq(schema.courtBlocks.courtId, id),
  });

  return c.json({ data: blocks });
});

// POST /courts/:id/blocks — create a block
courts.post("/:id/blocks", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();
  const user = c.get("user");
  const body = await c.req.json<{
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    reason?: string;
  }>();

  if (!body.date) return c.json({ error: "date is required" }, 400);

  const blockId = crypto.randomUUID();

  await db.insert(schema.courtBlocks).values({
    id: blockId,
    courtId: id,
    date: body.date,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    reason: body.reason ?? "",
    createdBy: user.id,
  });

  const block = await db.query.courtBlocks.findFirst({
    where: eq(schema.courtBlocks.id, blockId),
  });

  return c.json({ data: block }, 201);
});

// PUT /courts/:id/blocks/:blockId — update a block
courts.put("/:id/blocks/:blockId", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const { id, blockId } = c.req.param();
  const body = await c.req.json();

  // Whitelist updatable fields to prevent overwriting id/courtId
  const updates: Record<string, unknown> = {};
  if (body.date !== undefined) updates.date = body.date;
  if (body.startTime !== undefined) updates.startTime = body.startTime;
  if (body.endTime !== undefined) updates.endTime = body.endTime;
  if (body.reason !== undefined) updates.reason = body.reason;

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.courtBlocks)
      .set(updates)
      .where(
        and(
          eq(schema.courtBlocks.id, blockId),
          eq(schema.courtBlocks.courtId, id)
        )
      );
  }

  const block = await db.query.courtBlocks.findFirst({
    where: eq(schema.courtBlocks.id, blockId),
  });

  if (!block) return c.json({ error: "Block not found" }, 404);
  return c.json({ data: block });
});

// DELETE /courts/:id/blocks/:blockId — delete a block
courts.delete("/:id/blocks/:blockId", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const { id, blockId } = c.req.param();

  const block = await db.query.courtBlocks.findFirst({
    where: and(
      eq(schema.courtBlocks.id, blockId),
      eq(schema.courtBlocks.courtId, id)
    ),
  });

  if (!block) return c.json({ error: "Block not found" }, 404);

  await db
    .delete(schema.courtBlocks)
    .where(
      and(
        eq(schema.courtBlocks.id, blockId),
        eq(schema.courtBlocks.courtId, id)
      )
    );

  return c.json({ data: { id: blockId, deleted: true } });
});

// ── Availability ────────────────────────────────────────────────────────────

// GET /courts/:id/availability?date=YYYY-MM-DD
courts.get("/:id/availability", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const date = c.req.query("date");

  if (!date) return c.json({ error: "date query param required" }, 400);

  // Get schedule for this day of week (use noon UTC to avoid date-shift)
  const dayOfWeek = new Date(date + "T12:00:00Z").getUTCDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // JS Sun=0, we use Mon=0

  const schedule = await db.query.courtSchedules.findFirst({
    where: and(
      eq(schema.courtSchedules.courtId, id),
      eq(schema.courtSchedules.dayOfWeek, adjustedDay)
    ),
  });

  if (!schedule || schedule.isClosed) return c.json({ data: [] });

  // Get existing confirmed bookings for this court
  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(schema.bookings.courtId, id),
      eq(schema.bookings.status, "confirmed")
    ),
  });

  // Filter to this date
  const dayBookings = existingBookings.filter((b) => b.startTime.startsWith(date));

  // Get blocks for this date
  const blocks = await db.query.courtBlocks.findMany({
    where: and(
      eq(schema.courtBlocks.courtId, id),
      eq(schema.courtBlocks.date, date)
    ),
  });

  // Check for an all-day block (startTime and endTime both null)
  const hasAllDayBlock = blocks.some((b) => !b.startTime && !b.endTime);
  if (hasAllDayBlock) return c.json({ data: [] });

  // Get credit prices for this tenant (most recent effective ones)
  const dayType = getDayType(date);
  const allPrices = await db.query.creditPrices.findMany({
    where: and(
      eq(schema.creditPrices.tenantId, tenantId),
      eq(schema.creditPrices.dayType, dayType),
      lte(schema.creditPrices.effectiveFrom, date)
    ),
  });

  // Build a map: slot -> latest price
  const priceMap: Record<string, number> = {};
  for (const slot of ["morning", "afternoon", "evening"] as const) {
    const matching = allPrices
      .filter((p) => p.slot === slot)
      .sort((a, b) => (b.effectiveFrom > a.effectiveFrom ? 1 : -1));
    if (matching.length > 0) {
      priceMap[slot] = matching[0].price;
    }
  }

  // Build hourly slots
  const openHour = parseInt(schedule.openTime?.split(":")[0] ?? "6");
  const closeHour = parseInt(schedule.closeTime?.split(":")[0] ?? "22");

  const slots = [];
  for (let h = openHour; h < closeHour; h++) {
    const startISO = `${date}T${String(h).padStart(2, "0")}:00:00`;
    const endISO = `${date}T${String(h + 1).padStart(2, "0")}:00:00`;
    const slotStart = `${String(h).padStart(2, "0")}:00`;
    const slotEnd = `${String(h + 1).padStart(2, "0")}:00`;

    // Check if booked
    const booked = dayBookings.some((b) => b.startTime === startISO);

    // Check if blocked by a time-windowed block
    const blocked = blocks.some((b) => {
      if (!b.startTime || !b.endTime) return false;
      return slotStart >= b.startTime && slotEnd <= b.endTime;
    });

    // Resolve credit cost
    const slot = getSlot(h);
    const creditsCost = priceMap[slot] ?? null;

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !booked && !blocked,
      creditsCost,
    });
  }

  return c.json({ data: slots });
});

export default courts;
