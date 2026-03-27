import { format, subDays, isWithinInterval, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

// ── Daily stats (last 30 days) ───────────────────────────────────────────────

export interface DailyStat {
  date: string; // YYYY-MM-DD
  label: string; // "12 Mar"
  bookings: number;
  completed: number;
  cancellations: number;
  noShows: number;
  creditsConsumed: number;
  occupancyRate: number; // 0-100
}

const today = new Date(2026, 2, 27); // 2026-03-27

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export const DAILY_STATS: DailyStat[] = Array.from({ length: 30 }, (_, i) => {
  const d = subDays(today, 29 - i);
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const r = seededRandom(i + 42);
  const r2 = seededRandom(i + 99);

  const baseBookings = isWeekend ? 14 : 8;
  const bookings = Math.round(baseBookings + r * 8);
  const cancellations = Math.round(r2 * 2);
  const noShows = Math.round(seededRandom(i + 77) * 1.5);
  const completed = bookings - cancellations - noShows;
  const creditsConsumed = +(completed * (1 + r2 * 1.5)).toFixed(1);
  const totalSlots = 3 * 16; // 3 courts × 16 hours
  const occupancyRate = Math.round((bookings / totalSlots) * 100);

  return {
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "d MMM", { locale: es }),
    bookings,
    completed: Math.max(completed, 0),
    cancellations,
    noShows,
    creditsConsumed,
    occupancyRate: Math.min(occupancyRate, 95),
  };
});

// ── Heatmap data (hour × day of week) ────────────────────────────────────────

export interface HeatmapCell {
  dayOfWeek: number; // 0=Lun … 6=Dom
  dayLabel: string;
  hour: number; // 6–21
  bookings: number; // average bookings in this slot
  intensity: number; // 0–1 normalized
}

const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function generateHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  let maxBookings = 0;

  const raw: { day: number; hour: number; bookings: number }[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour < 22; hour++) {
      const isWeekend = day >= 5;
      const isEvening = hour >= 18;
      const isMorning = hour < 12;

      let base = 1;
      if (isWeekend && isEvening) base = 2.8;
      else if (isWeekend) base = 2.2;
      else if (isEvening) base = 2.5;
      else if (isMorning && hour >= 8 && hour <= 10) base = 1.8;
      else if (!isMorning && hour >= 12 && hour <= 14) base = 1.5;

      const r = seededRandom(day * 100 + hour);
      const bookings = +(base + r * 1.2).toFixed(1);
      if (bookings > maxBookings) maxBookings = bookings;

      raw.push({ day, hour, bookings });
    }
  }

  for (const r of raw) {
    cells.push({
      dayOfWeek: r.day,
      dayLabel: dayLabels[r.day],
      hour: r.hour,
      bookings: r.bookings,
      intensity: r.bookings / maxBookings,
    });
  }

  return cells;
}

export const HEATMAP_DATA = generateHeatmap();

// ── Bookings by court (pie chart data) ───────────────────────────────────────

export const BOOKINGS_BY_COURT = [
  { name: "Court 1", value: 42, fill: "#1d4ed8" },
  { name: "Court 2", value: 35, fill: "#3b82f6" },
  { name: "Court 3", value: 28, fill: "#93c5fd" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function filterByDateRange(
  stats: DailyStat[],
  from: Date,
  to: Date
): DailyStat[] {
  return stats.filter((s) =>
    isWithinInterval(startOfDay(new Date(s.date)), {
      start: startOfDay(from),
      end: startOfDay(to),
    })
  );
}

export function getKPIs(stats: DailyStat[]) {
  const totalBookings = stats.reduce((s, d) => s + d.bookings, 0);
  const totalCompleted = stats.reduce((s, d) => s + d.completed, 0);
  const totalCredits = stats.reduce((s, d) => s + d.creditsConsumed, 0);
  const totalCancellations = stats.reduce((s, d) => s + d.cancellations, 0);
  const totalNoShows = stats.reduce((s, d) => s + d.noShows, 0);
  const avgOccupancy =
    stats.length > 0
      ? Math.round(stats.reduce((s, d) => s + d.occupancyRate, 0) / stats.length)
      : 0;
  const avgBookingsPerDay =
    stats.length > 0 ? +(totalBookings / stats.length).toFixed(1) : 0;
  const completionRate =
    totalBookings > 0
      ? +((totalCompleted / totalBookings) * 100).toFixed(1)
      : 0;

  return {
    totalBookings,
    totalCompleted,
    totalCredits: +totalCredits.toFixed(1),
    totalCancellations,
    totalNoShows,
    avgOccupancy,
    avgBookingsPerDay,
    completionRate,
    cancellationRate:
      totalBookings > 0
        ? +((totalCancellations / totalBookings) * 100).toFixed(1)
        : 0,
    noShowRate:
      totalBookings > 0
        ? +((totalNoShows / totalBookings) * 100).toFixed(1)
        : 0,
  };
}
