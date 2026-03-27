import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const courts = new Hono<{ Bindings: Bindings; Variables: Variables }>();

courts.use("/*", authMiddleware);

// GET /courts — all authenticated users
courts.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const result = await db.query.courts.findMany({
    where: eq(schema.courts.tenantId, tenantId),
  });

  return c.json({ data: result });
});

// POST /courts — staff, super_admin
courts.post("/", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const body = await c.req.json();

  const id = crypto.randomUUID();

  await db.insert(schema.courts).values({
    id,
    tenantId,
    name: body.name,
    type: body.type,
    surface: body.surface,
    capacity: body.capacity ?? 4,
    isActive: true,
    createdBy: user.id,
  });

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, id) });
  return c.json({ data: court }, 201);
});

// PUT /courts/:id — staff, super_admin
courts.put("/:id", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const body = await c.req.json();

  await db
    .update(schema.courts)
    .set(body)
    .where(and(eq(schema.courts.id, id), eq(schema.courts.tenantId, tenantId)));

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, id) });
  return c.json({ data: court });
});

// GET /courts/:id/schedule
courts.get("/:id/schedule", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const schedules = await db.query.courtSchedules.findMany({
    where: eq(schema.courtSchedules.courtId, id),
  });

  return c.json({ data: schedules });
});

// GET /courts/:id/availability?date=YYYY-MM-DD
courts.get("/:id/availability", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();
  const date = c.req.query("date");

  if (!date) return c.json({ error: "date query param required" }, 400);

  // Get schedule for this day
  const dayOfWeek = new Date(date).getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // JS Sun=0, we use Mon=0

  const schedule = await db.query.courtSchedules.findFirst({
    where: and(
      eq(schema.courtSchedules.courtId, id),
      eq(schema.courtSchedules.dayOfWeek, adjustedDay)
    ),
  });

  if (!schedule || schedule.isClosed) return c.json({ data: [] });

  // Get existing bookings
  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(schema.bookings.courtId, id),
      eq(schema.bookings.status, "confirmed")
    ),
  });

  // Filter to this date
  const dayBookings = existingBookings.filter((b) => b.startTime.startsWith(date));

  // Build slots
  const openHour = parseInt(schedule.openTime?.split(":")[0] ?? "6");
  const closeHour = parseInt(schedule.closeTime?.split(":")[0] ?? "22");

  const slots = [];
  for (let h = openHour; h < closeHour; h++) {
    const startISO = `${date}T${String(h).padStart(2, "0")}:00:00`;
    const endISO = `${date}T${String(h + 1).padStart(2, "0")}:00:00`;
    const booked = dayBookings.some((b) => b.startTime === startISO);

    slots.push({
      startTime: `${String(h).padStart(2, "0")}:00`,
      endTime: `${String(h + 1).padStart(2, "0")}:00`,
      available: !booked,
    });
  }

  return c.json({ data: slots });
});

export default courts;
