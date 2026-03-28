/**
 * Domain utility functions — pure functions with no data dependencies.
 * Pages should import these instead of mock-data.ts.
 */

// ── Sport ───────────────────────────────────────────────────────────────────

export type CourtSport = "padel" | "tenis" | "futbol" | "squash" | "pickleball" | "frontenis" | "otro";

const SPORT_LABELS: Record<string, string> = {
  padel: "Padel", tenis: "Tenis", futbol: "Futbol", squash: "Squash",
  pickleball: "Pickleball", frontenis: "Frontenis", otro: "Otro",
};
const SPORT_EMOJIS: Record<string, string> = {
  padel: "🏓", tenis: "🎾", futbol: "⚽", squash: "🏸",
  pickleball: "🏓", frontenis: "🏸", otro: "🏟️",
};

export function getSportLabel(sport: string): string { return SPORT_LABELS[sport] ?? sport; }
export function getSportEmoji(sport: string): string { return SPORT_EMOJIS[sport] ?? "🏟️"; }

// ── Court type ──────────────────────────────────────────────────────────────

export function getCourtTypeLabel(type: string): string {
  return { indoor: "Indoor", outdoor: "Outdoor", covered: "Techado" }[type] ?? type;
}

// ── Booking status ──────────────────────────────────────────────────────────

export function getBookingDisplayStatus(booking: { status: string; startTime: string; endTime: string }): string {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "no_show") return "no_show";
  if (booking.status === "completed") return "completed";
  const now = new Date().toISOString();
  if (booking.startTime <= now && booking.endTime > now) return "in_progress";
  if (booking.endTime <= now) return "completed";
  return "confirmed";
}

export function getStatusColor(status: string): string {
  return {
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-amber-100 text-amber-700",
  }[status] ?? "bg-gray-100 text-gray-600";
}

export function getStatusLabel(status: string): string {
  return {
    confirmed: "Confirmada",
    in_progress: "En curso",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistio",
  }[status] ?? status;
}

// ── Court version helper ────────────────────────────────────────────────────

export function getCurrentVersion(court: { versions?: { version: number }[] } & Record<string, unknown>): Record<string, unknown> {
  if (court.versions && court.versions.length > 0) {
    return court.versions.reduce((a, b) => (a.version > b.version ? a : b)) as Record<string, unknown>;
  }
  // Flat court (no versions) — return the court itself as the "version"
  return court;
}

// ── Payment methods ─────────────────────────────────────────────────────────

export function getPaymentMethodLabel(method: string): string {
  return { Efectivo: "Efectivo", Yape: "Yape", Plin: "Plin", Transferencia: "Transferencia", POS: "POS" }[method] ?? method;
}

// ── Ticket/Support ──────────────────────────────────────────────────────────

export function getPriorityColor(p: string): string {
  return { low: "bg-gray-100 text-gray-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" }[p] ?? "";
}
export function getPriorityLabel(p: string): string {
  return { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" }[p] ?? p;
}
export function getTicketStatusLabel(s: string): string {
  return { open: "Abierto", in_progress: "En progreso", waiting: "En espera", closed: "Cerrado" }[s] ?? s;
}
export function getCategoryLabel(c: string): string {
  return { technical: "Tecnico", billing: "Facturacion", feature_request: "Solicitud", general: "General", bug: "Bug" }[c] ?? c;
}
