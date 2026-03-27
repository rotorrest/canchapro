import { eq, and, gte, lte } from "drizzle-orm";
import type { Bindings } from "../types";
import type { NotificationMessage } from "../queue/notifications";
import { createDb, schema } from "../db";

// ── Booking reminders ───────────────────────────────────────────────────────

async function sendBookingReminders(env: Bindings): Promise<void> {
  const db = createDb(env.DB);
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const nowISO = now.toISOString();
  const twoHoursISO = twoHoursLater.toISOString();

  // Find confirmed bookings starting in the next 2 hours
  const upcomingBookings = await db.query.bookings.findMany({
    where: and(
      eq(schema.bookings.status, "confirmed"),
      gte(schema.bookings.startTime, nowISO),
      lte(schema.bookings.startTime, twoHoursISO),
    ),
  });

  let reminded = 0;

  for (const booking of upcomingBookings) {
    const kvKey = `reminder:${booking.id}`;

    // Check if already reminded via KV
    const alreadyReminded = await env.CACHE_KV.get(kvKey);
    if (alreadyReminded) continue;

    // Queue a reminder notification
    const message: NotificationMessage = {
      type: "booking_reminder",
      tenantId: booking.tenantId,
      bookingId: booking.id,
      memberId: booking.memberId,
    };

    await env.NOTIFICATIONS_QUEUE.send(message);

    // Mark as reminded (TTL: 24 hours)
    await env.CACHE_KV.put(kvKey, "1", { expirationTtl: 86400 });
    reminded++;
  }

  console.log(`[Cron] Booking reminders: ${reminded} sent out of ${upcomingBookings.length} upcoming`);
}

// ── Monthly credit reset ────────────────────────────────────────────────────

async function resetMonthlyCredits(env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  // Get all members with a monthly allocation
  const allMembers = await db.query.members.findMany({
    where: gte(schema.members.creditAllocationMonthly, 1),
  });

  let processed = 0;

  for (const member of allMembers) {
    const allocation = member.creditAllocationMonthly;

    // Add monthly credits to balance
    await db
      .update(schema.members)
      .set({ creditBalance: member.creditBalance + allocation })
      .where(eq(schema.members.id, member.id));

    // Log credit transaction
    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      tenantId: member.tenantId,
      memberId: member.id,
      amount: allocation,
      type: "allocation",
      reason: "Asignacion mensual automatica",
    });

    processed++;
  }

  console.log(`[Cron] Monthly credit reset: ${processed} members processed`);
}

// ── Cron trigger handler ────────────────────────────────────────────────────

export default {
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const trigger = event.cron;

    console.log(`[Cron] Triggered: ${trigger} at ${new Date(event.scheduledTime).toISOString()}`);

    switch (trigger) {
      // Hourly: send booking reminders
      // wrangler.toml: crons = ["0 * * * *"]
      case "0 * * * *":
        await sendBookingReminders(env);
        break;

      // 1st of month at midnight UTC: reset credits
      // wrangler.toml: crons = ["0 0 1 * *"]
      case "0 0 1 * *":
        await resetMonthlyCredits(env);
        break;

      default:
        console.warn(`[Cron] Unhandled cron trigger: ${trigger}`);
    }
  },
};
