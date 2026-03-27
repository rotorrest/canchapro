import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const bookings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

bookings.use("/*", authMiddleware);

// GET /bookings
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

// POST /bookings — member only
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
      eq(schema.bookings.startTime, body.startTime)
    ),
  });
  if (existing) return c.json({ error: "Court already booked" }, 409);

  // TODO: calculate credits from credit_prices
  const creditsRequired = 1; // placeholder

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

// DELETE /bookings/:id — member cancels own
bookings.delete("/:id", requireRole("member"), async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
  if (!booking || booking.status !== "confirmed") {
    return c.json({ error: "Booking not found or not cancellable" }, 400);
  }

  await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(eq(schema.bookings.id, id));

  return c.json({ data: { bookingId: id, status: "cancelled" } });
});

export default bookings;
