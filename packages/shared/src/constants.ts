export const SLOT_HOURS = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 22 },
} as const;

export const BOOKING_WINDOW_DAYS = 60;
export const MIN_BOOKING_MINUTES = 60;

export const PAYMENT_METHODS = [
  "Efectivo",
  "Yape",
  "Plin",
  "Transferencia",
  "POS",
] as const;

export const PLANS = ["starter", "pro", "business"] as const;
