import { Hono } from "hono";
import { eq, and, desc, lte } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const bookings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

bookings.use("/*", authMiddleware);

// ── Helpers ─────────────────────────────────────────────────────────────────

type SlotName = "morning" | "afternoon" | "evening";
type DayType = "weekday" | "weekend";

function resolveSlot(startTime: string): SlotName {
  const hour = new Date(startTime).getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function resolveDayType(startTime: string): DayType {
  const day = new Date(startTime).getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

async function lookupCreditPrice(
  db: ReturnType<typeof createDb>,
  tenantId: string,
  startTime: string,
): Promise<number> {
  const slot = resolveSlot(startTime);
  const dayType = resolveDayType(startTime);
  const dateStr = startTime.slice(0, 10); // YYYY-MM-DD

  const price = await db.query.creditPrices.findFirst({
    where: and(
      eq(schema.creditPrices.tenantId, tenantId),
      eq(schema.creditPrices.slot, slot),
      eq(schema.creditPrices.dayType, dayType),
      lte(schema.creditPrices.effectiveFrom, dateStr),
    ),
    orderBy: desc(schema.creditPrices.effectiveFrom),
  });

  return price?.price ?? 1;
}

// ── GET /bookings ───────────────────────────────────────────────────────────

bookings.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");

  let result;
  if (user.role === "member") {
    const member = await db.query.members.findFirst({
      where: and(eq(schema.members.tenantId, tenantId), eq(schema.members.userId, user.id)),
    });
    if (!member) return c.json({ data: [] });
    result = await db.query.bookings.findMany({
      where: eq(schema.bookings.memberId, member.id),
    });
  } else {
    result = await db.query.bookings.findMany({
      where: eq(schema.bookings.tenantId, tenantId),
    });
  }

  return c.json({ data: result });
});

// ── GET /bookings/me — member's own bookings with court name ────────────────

bookings.get("/me", requireRole("member"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.tenantId, tenantId), eq(schema.members.userId, user.id)),
  });
  if (!member) return c.json({ data: [] });

  const rows = await db.query.bookings.findMany({
    where: and(eq(schema.bookings.memberId, member.id), eq(schema.bookings.tenantId, tenantId)),
    orderBy: desc(schema.bookings.startTime),
  });

  // Look up court names for each booking
  const courtIds = [...new Set(rows.map((b) => b.courtId))];
  const courts = await Promise.all(
    courtIds.map((cid) => db.query.courts.findFirst({ where: eq(schema.courts.id, cid) })),
  );
  const courtMap = new Map(courts.filter(Boolean).map((ct) => [ct!.id, ct!.name]));

  const data = rows.map((b) => ({
    ...b,
    courtName: courtMap.get(b.courtId) ?? null,
  }));

  return c.json({ data });
});

// ── POST /bookings — member creates own booking ────────────────────────────

bookings.post("/", requireRole("member"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const body = await c.req.json<{ courtId: string; startTime: string; endTime: string }>();

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.tenantId, tenantId), eq(schema.members.userId, user.id)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  // Check double booking
  const existing = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.courtId, body.courtId),
      eq(schema.bookings.status, "confirmed"),
      eq(schema.bookings.startTime, body.startTime),
    ),
  });
  if (existing) return c.json({ error: "Court already booked" }, 409);

  // Calculate credits from credit_prices table
  const creditsRequired = await lookupCreditPrice(db, tenantId, body.startTime);

  if (member.creditBalance < creditsRequired) {
    return c.json({ error: "Insufficient credits" }, 400);
  }

  const id = crypto.randomUUID();

  await db.insert(schema.bookings).values({
    id,
    tenantId,
    memberId: member.id,
    courtId: body.courtId,
    startTime: body.startTime,
    endTime: body.endTime,
    creditsDeducted: creditsRequired,
    status: "confirmed",
  });

  // Deduct credits
  await db
    .update(schema.members)
    .set({ creditBalance: member.creditBalance - creditsRequired })
    .where(eq(schema.members.id, member.id));

  // Log transaction
  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: member.id,
    amount: -creditsRequired,
    type: "deduction",
    reason: "Reserva",
    bookingId: id,
    createdBy: user.id,
  });

  // Queue notification
  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "booking_confirmed",
    tenantId,
    bookingId: id,
    memberId: member.id,
  });

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  return c.json({ data: booking }, 201);
});

// ── POST /bookings/staff — staff creates booking on behalf of member ────────

bookings.post("/staff", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const body = await c.req.json<{
    memberId: string;
    courtId: string;
    startTime: string;
    endTime: string;
  }>();

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, body.memberId), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  // Check double booking
  const existing = await db.query.bookings.findFirst({
    where: and(
      eq(schema.bookings.courtId, body.courtId),
      eq(schema.bookings.status, "confirmed"),
      eq(schema.bookings.startTime, body.startTime),
    ),
  });
  if (existing) return c.json({ error: "Court already booked" }, 409);

  // Calculate credits from credit_prices table
  const creditsRequired = await lookupCreditPrice(db, tenantId, body.startTime);

  if (member.creditBalance < creditsRequired) {
    return c.json({ error: "Insufficient credits" }, 400);
  }

  const id = crypto.randomUUID();

  await db.insert(schema.bookings).values({
    id,
    tenantId,
    memberId: member.id,
    courtId: body.courtId,
    startTime: body.startTime,
    endTime: body.endTime,
    creditsDeducted: creditsRequired,
    status: "confirmed",
  });

  // Deduct credits
  await db
    .update(schema.members)
    .set({ creditBalance: member.creditBalance - creditsRequired })
    .where(eq(schema.members.id, member.id));

  // Log transaction
  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: member.id,
    amount: -creditsRequired,
    type: "deduction",
    reason: "Reserva (creada por staff)",
    bookingId: id,
    createdBy: user.id,
  });

  // Queue notification
  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "booking_confirmed",
    tenantId,
    bookingId: id,
    memberId: member.id,
  });

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  return c.json({ data: booking }, 201);
});

// ── PUT /bookings/:id/status — staff updates booking status ─────────────────

bookings.put("/:id/status", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const { id } = c.req.param();
  const body = await c.req.json<{ status: "completed" | "no_show" | "cancelled" }>();

  const booking = await db.query.bookings.findFirst({
    where: and(eq(schema.bookings.id, id), eq(schema.bookings.tenantId, tenantId)),
  });
  if (!booking) return c.json({ error: "Booking not found" }, 404);

  if (booking.status !== "confirmed") {
    return c.json({ error: "Only confirmed bookings can be updated" }, 400);
  }

  const updates: Record<string, unknown> = { status: body.status };
  if (body.status === "cancelled") {
    updates.cancelledAt = new Date().toISOString();
  }

  await db
    .update(schema.bookings)
    .set(updates)
    .where(eq(schema.bookings.id, id));

  // Refund credits when cancelling a confirmed booking
  if (body.status === "cancelled") {
    const member = await db.query.members.findFirst({
      where: eq(schema.members.id, booking.memberId),
    });

    if (member) {
      await db
        .update(schema.members)
        .set({ creditBalance: member.creditBalance + booking.creditsDeducted })
        .where(eq(schema.members.id, member.id));

      await db.insert(schema.creditTransactions).values({
        id: crypto.randomUUID(),
        tenantId,
        memberId: member.id,
        amount: booking.creditsDeducted,
        type: "adjustment",
        reason: "Reembolso por cancelación (staff)",
        bookingId: id,
        createdBy: user.id,
      });

      // Queue cancellation notification
      await c.env.NOTIFICATIONS_QUEUE.send({
        type: "booking_cancelled",
        tenantId,
        bookingId: id,
        memberId: member.id,
      });
    }
  }

  const updated = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  return c.json({ data: updated });
});

// ── DELETE /bookings/:id — member cancels own booking with credit refund ────

bookings.delete("/:id", requireRole("member"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const { id } = c.req.param();

  const booking = await db.query.bookings.findFirst({
    where: and(eq(schema.bookings.id, id), eq(schema.bookings.tenantId, tenantId)),
  });
  if (!booking || booking.status !== "confirmed") {
    return c.json({ error: "Booking not found or not cancellable" }, 400);
  }

  // Verify the booking belongs to this member
  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.tenantId, tenantId), eq(schema.members.userId, user.id)),
  });
  if (!member || member.id !== booking.memberId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(eq(schema.bookings.id, id));

  // Refund credits
  await db
    .update(schema.members)
    .set({ creditBalance: member.creditBalance + booking.creditsDeducted })
    .where(eq(schema.members.id, member.id));

  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: member.id,
    amount: booking.creditsDeducted,
    type: "adjustment",
    reason: "Reembolso por cancelación",
    bookingId: id,
    createdBy: user.id,
  });

  // Queue cancellation notification
  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "booking_cancelled",
    tenantId,
    bookingId: id,
    memberId: member.id,
  });

  return c.json({ data: { bookingId: id, status: "cancelled" } });
});

export default bookings;
