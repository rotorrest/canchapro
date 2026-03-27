import { eq } from "drizzle-orm";
import type { Bindings } from "../types";
import { createDb, schema } from "../db";

// ── Message types ───────────────────────────────────────────────────────────

interface BookingConfirmedMessage {
  type: "booking_confirmed";
  tenantId: string;
  bookingId: string;
  memberId: string;
}

interface BookingCancelledMessage {
  type: "booking_cancelled";
  tenantId: string;
  bookingId: string;
  memberId: string;
  creditsReturned: number;
}

interface BookingReminderMessage {
  type: "booking_reminder";
  tenantId: string;
  bookingId: string;
  memberId: string;
}

interface WelcomeMemberMessage {
  type: "welcome_member";
  tenantId: string;
  userId: string;
  tempPassword: string;
}

interface PasswordResetMessage {
  type: "password_reset";
  tenantId: string;
  userId: string;
  code: string;
}

export type NotificationMessage =
  | BookingConfirmedMessage
  | BookingCancelledMessage
  | BookingReminderMessage
  | WelcomeMemberMessage
  | PasswordResetMessage;

// ── WhatsApp sender stub ────────────────────────────────────────────────────

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  // TODO: integrate with Meta WhatsApp Business API
  // POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
  // For now, log to console
  console.log(`[WhatsApp] To: ${phone} | Message: ${message}`);
}

// ── Message handlers ────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function handleBookingConfirmed(msg: BookingConfirmedMessage, env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, msg.bookingId) });
  if (!booking) return;

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, msg.memberId) });
  if (!member) return;

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, member.userId) });
  if (!user) return;

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, booking.courtId) });
  if (!court) return;

  const message = `Hola ${user.name}, tu reserva en ${court.name} el ${formatDate(booking.startTime)} a las ${formatTime(booking.startTime)} esta confirmada.`;
  await sendWhatsApp(user.email, message); // phone field TBD, using email as placeholder
}

async function handleBookingCancelled(msg: BookingCancelledMessage, env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, msg.bookingId) });
  if (!booking) return;

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, msg.memberId) });
  if (!member) return;

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, member.userId) });
  if (!user) return;

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, booking.courtId) });
  if (!court) return;

  const message = `Hola ${user.name}, tu reserva en ${court.name} el ${formatDate(booking.startTime)} fue cancelada. Se devolvieron ${msg.creditsReturned} creditos a tu saldo.`;
  await sendWhatsApp(user.email, message);
}

async function handleBookingReminder(msg: BookingReminderMessage, env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, msg.bookingId) });
  if (!booking) return;

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, msg.memberId) });
  if (!member) return;

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, member.userId) });
  if (!user) return;

  const court = await db.query.courts.findFirst({ where: eq(schema.courts.id, booking.courtId) });
  if (!court) return;

  const message = `Hola ${user.name}, recordatorio: tienes reserva en ${court.name} hoy a las ${formatTime(booking.startTime)}.`;
  await sendWhatsApp(user.email, message);
}

async function handleWelcomeMember(msg: WelcomeMemberMessage, env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, msg.userId) });
  if (!user) return;

  const branding = await db.query.tenantBranding.findFirst({
    where: eq(schema.tenantBranding.tenantId, msg.tenantId),
  });

  const clubName = branding?.clubName ?? "CanchaPro";

  const message = `Bienvenido a ${clubName}! Tu usuario es ${user.email} y tu contrasena temporal es ${msg.tempPassword}. Cambiala al ingresar.`;
  await sendWhatsApp(user.email, message);
}

async function handlePasswordReset(msg: PasswordResetMessage, env: Bindings): Promise<void> {
  const db = createDb(env.DB);

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, msg.userId) });
  if (!user) return;

  const message = `Tu codigo de recuperacion es: ${msg.code}. Valido por 15 minutos.`;
  await sendWhatsApp(user.email, message);
}

// ── Queue consumer ──────────────────────────────────────────────────────────

export default {
  async queue(batch: MessageBatch<NotificationMessage>, env: Bindings): Promise<void> {
    for (const msg of batch.messages) {
      try {
        switch (msg.body.type) {
          case "booking_confirmed":
            await handleBookingConfirmed(msg.body, env);
            break;
          case "booking_cancelled":
            await handleBookingCancelled(msg.body, env);
            break;
          case "booking_reminder":
            await handleBookingReminder(msg.body, env);
            break;
          case "welcome_member":
            await handleWelcomeMember(msg.body, env);
            break;
          case "password_reset":
            await handlePasswordReset(msg.body, env);
            break;
          default:
            console.warn(`[Notifications] Unknown message type: ${(msg.body as any).type}`);
        }
        msg.ack();
      } catch (error) {
        console.error(`[Notifications] Failed to process message ${msg.id}:`, error);
        msg.retry();
      }
    }
  },
};
