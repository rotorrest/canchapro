import { useMemo, useState } from "react";
import {
  BOOKINGS,
  COURT_BLOCKS,
  MEMBERS,
  getCurrentVersion,
  getActiveScheduleForCourt,
  getCurrentScheduleVersion,
  getBlocksForCourt,
} from "@/lib/mock-data";
import type { Booking, Court } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, MapPin, Plus, X, Ban, CalendarDays, Calendar } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTenantData } from "@/hooks/useTenantData";
import { useSedeStore } from "@/store/sedeStore";

function formatDate(d: Date) {
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("es-PE", { weekday: "short", day: "numeric" });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysTo(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getMonday(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  return r;
}

function isBlocked(courtId: string, date: Date, hour: number, tenantId: string, sedeId: string | null): string | null {
  const dateStr = toDateStr(date);
  const hourStr = `${String(hour).padStart(2, "0")}:00`;
  const blocks = getBlocksForCourt(courtId, dateStr, tenantId, sedeId);
  for (const b of blocks) {
    if (!b.startTime && !b.endTime) return b.reason || "Bloqueado";
    if (b.startTime && b.endTime && hourStr >= b.startTime && hourStr < b.endTime) {
      return b.reason || "Bloqueado";
    }
  }
  return null;
}

function isOutsideSchedule(courtId: string, date: Date, hour: number): boolean {
  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const sch = getActiveScheduleForCourt(courtId);
  if (!sch) return true;
  const sv = getCurrentScheduleVersion(sch);
  const dayConfig = sv.days.find((d) => d.dayOfWeek === dow);
  if (!dayConfig || dayConfig.isClosed) return true;
  const hourStr = `${String(hour).padStart(2, "0")}:00`;
  return !dayConfig.timeRanges.some((r) => hourStr >= r.startTime && hourStr < r.endTime);
}

// ── Week summary helpers ─────────────────────────────────────────────────────

function getWeekDaySummary(
  date: Date,
  courts: Court[],
  bookings: Booking[],
  tenantId: string,
) {
  const dateStr = toDateStr(date);
  const dayBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    return b.startTime.split("T")[0] === dateStr;
  });

  let totalSlots = 0;
  let bookedSlots = 0;
  let blockedSlots = 0;

  for (const court of courts) {
    for (let h = 6; h <= 21; h++) {
      const outside = isOutsideSchedule(court.id, date, h);
      if (outside) continue;
      totalSlots++;
      const sedeId = court.sedeId ?? null;
      const blocked = isBlocked(court.id, date, h, tenantId, sedeId);
      if (blocked) { blockedSlots++; continue; }
      const key = `${court.id}-${h}`;
      const booked = dayBookings.some((b) => {
        const bHour = parseInt(b.startTime.split("T")[1].split(":")[0]);
        return b.courtId === court.id && bHour === h;
      });
      if (booked) bookedSlots++;
    }
  }

  const available = totalSlots - bookedSlots - blockedSlots;
  const occupancy = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return { totalSlots, bookedSlots, blockedSlots, available, occupancy, bookingCount: dayBookings.length };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const td = useTenantData();
  const { selectedSede } = useSedeStore();
  const activeCourts = useMemo(
    () => td.courts.filter((c) => c.isActive && (!selectedSede || c.sedeId === selectedSede)),
    [td.courts, selectedSede]
  );
  const activeSedeName = selectedSede ? td.sedes.find((s) => s.id === selectedSede)?.name : null;

  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; hour: number } | null>(null);
  const [bookingForm, setBookingForm] = useState({ memberId: "", duration: 1 });

  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const dateStr = toDateStr(date);
  const tenantId = td.tenantId ?? "";

  // Week dates
  const weekStart = getMonday(date);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysTo(weekStart, i));

  // Day view booking map
  const bookingMap = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const bDate = b.startTime.split("T")[0];
      if (bDate !== dateStr) continue;
      const bHour = parseInt(b.startTime.split("T")[1].split(":")[0]);
      map.set(`${b.courtId}-${bHour}`, b);
    }
    return map;
  }, [bookings, dateStr]);

  // Week summaries
  const weekSummaries = useMemo(() => {
    return weekDates.map((d) => ({
      date: d,
      ...getWeekDaySummary(d, activeCourts, bookings, tenantId),
    }));
  }, [weekDates, activeCourts, bookings, tenantId]);

  function prevDay() { setDate((d) => addDaysTo(d, view === "week" ? -7 : -1)); }
  function nextDay() { setDate((d) => addDaysTo(d, view === "week" ? 7 : 1)); }
  function goToday() { setDate(new Date()); }

  function openBookingModal(courtId: string, hour: number) {
    setSelectedSlot({ courtId, hour });
    setBookingForm({ memberId: "", duration: 1 });
    setShowBookingModal(true);
  }

  function handleCreateBooking() {
    if (!selectedSlot || !bookingForm.memberId) return;
    const court = activeCourts.find((c) => c.id === selectedSlot.courtId);
    const member = MEMBERS.find((m) => m.id === bookingForm.memberId);
    if (!court || !member) return;

    const v = getCurrentVersion(court);
    const startH = String(selectedSlot.hour).padStart(2, "0");
    const endH = String(selectedSlot.hour + bookingForm.duration).padStart(2, "0");

    const newBooking: Booking = {
      id: `b${Date.now()}`,
      tenantId: td.tenantId ?? "",
      memberId: member.id,
      memberName: member.user.name,
      courtId: court.id,
      courtVersionId: v.id,
      courtName: v.name,
      startTime: `${dateStr}T${startH}:00:00`,
      endTime: `${dateStr}T${endH}:00:00`,
      creditsDeducted: bookingForm.duration,
      status: "confirmed",
      cancelledAt: null,
      createdAt: new Date().toISOString(),
    };

    setBookings([...bookings, newBooking]);
    setShowBookingModal(false);
  }

  function handleCancelBooking(bookingId: string) {
    setBookings(bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const, cancelledAt: new Date().toISOString() } : b
    ));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          {td.hasMultipleSedes && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">{activeSedeName ?? "Todas las sedes"}</span>
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView("day")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Dia
          </button>
          <button
            onClick={() => setView("week")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Semana
          </button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={goToday} className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
          Hoy
        </button>
        <span className="text-sm font-medium text-gray-900 capitalize flex-1 text-center">
          {view === "day"
            ? formatDate(date)
            : `${formatShortDate(weekDates[0])} — ${formatShortDate(weekDates[6])}`}
        </span>
        <button onClick={nextDay} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ═══ DAY VIEW ═══ */}
      {view === "day" && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-16 sticky left-0 bg-gray-50 z-10">Hora</th>
                    {activeCourts.map((c) => {
                      const v = getCurrentVersion(c);
                      return (
                        <th key={c.id} className="px-2 py-2 text-center font-medium text-gray-500 min-w-[120px]">
                          {v.name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour} className="border-b border-gray-50">
                      <td className="px-3 py-0 text-gray-400 font-mono sticky left-0 bg-white z-10 border-r border-gray-100">
                        {String(hour).padStart(2, "0")}:00
                      </td>
                      {activeCourts.map((court) => {
                        const key = `${court.id}-${hour}`;
                        const booking = bookingMap.get(key);
                        const blocked = isBlocked(court.id, date, hour, tenantId, court.sedeId);
                        const outside = isOutsideSchedule(court.id, date, hour);

                        if (outside) {
                          return (
                            <td key={court.id} className="px-1 py-1">
                              <div className="h-10 rounded bg-gray-50 flex items-center justify-center text-gray-300 text-[10px]">
                                Cerrado
                              </div>
                            </td>
                          );
                        }

                        if (blocked) {
                          return (
                            <td key={court.id} className="px-1 py-1">
                              <div className="h-10 rounded bg-red-50 border border-red-100 flex items-center justify-center gap-1 text-red-400 text-[10px]">
                                <Ban className="w-3 h-3" />
                                {blocked}
                              </div>
                            </td>
                          );
                        }

                        if (booking) {
                          return (
                            <td key={court.id} className="px-1 py-1">
                              <div className="h-10 rounded bg-blue-100 border border-blue-200 px-2 flex items-center justify-between group cursor-default">
                                <p className="font-medium text-blue-900 text-[11px] truncate">{booking.memberName}</p>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0 ml-1"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={court.id} className="px-1 py-1">
                            <button
                              onClick={() => openBookingModal(court.id, hour)}
                              className="h-10 w-full rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500 transition-colors group"
                            >
                              <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Reservada</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-dashed border-gray-200" /> Disponible</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-50 border border-red-100" /> Bloqueada</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-50" /> Cerrado</div>
          </div>
        </>
      )}

      {/* ═══ WEEK VIEW ═══ */}
      {view === "week" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {weekSummaries.map((ws) => {
              const isToday = toDateStr(ws.date) === toDateStr(new Date());
              const dow = ws.date.getDay();
              const isWeekend = dow === 0 || dow === 6;

              return (
                <button
                  key={toDateStr(ws.date)}
                  onClick={() => { setDate(ws.date); setView("day"); }}
                  className={`p-4 text-left hover:bg-blue-50/50 transition-colors ${
                    isToday ? "bg-blue-50/30" : ""
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${
                        isToday ? "text-blue-700" : isWeekend ? "text-amber-600" : "text-gray-500"
                      }`}>
                        {ws.date.toLocaleDateString("es-PE", { weekday: "short" })}
                      </p>
                      <p className={`text-2xl font-bold ${isToday ? "text-blue-700" : "text-gray-900"}`}>
                        {ws.date.getDate()}
                      </p>
                    </div>
                    {isToday && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">Hoy</span>
                    )}
                  </div>

                  {/* Occupancy bar */}
                  {ws.totalSlots > 0 ? (
                    <>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full flex">
                          <div className="bg-blue-500 h-full" style={{ width: `${(ws.bookedSlots / ws.totalSlots) * 100}%` }} />
                          <div className="bg-red-300 h-full" style={{ width: `${(ws.blockedSlots / ws.totalSlots) * 100}%` }} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Reservas</span>
                          <span className="text-xs font-bold text-gray-900">{ws.bookingCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Ocupacion</span>
                          <span className={`text-xs font-bold ${
                            ws.occupancy >= 70 ? "text-emerald-600" : ws.occupancy >= 40 ? "text-amber-600" : "text-gray-500"
                          }`}>
                            {ws.occupancy}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Disponibles</span>
                          <span className="text-xs font-medium text-gray-600">{ws.available}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-300 mt-2">Sin horario</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking modal */}
      <Dialog.Root open={showBookingModal} onOpenChange={setShowBookingModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900">Nueva reserva</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Crear reserva para un socio</Dialog.Description>

            {selectedSlot && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <strong>{activeCourts.find((c) => c.id === selectedSlot.courtId) ? getCurrentVersion(activeCourts.find((c) => c.id === selectedSlot.courtId)!).name : ""}</strong>
                {" · "}{formatDate(date)}
                {" · "}{String(selectedSlot.hour).padStart(2, "0")}:00
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Socio</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bookingForm.memberId}
                  onChange={(e) => setBookingForm({ ...bookingForm, memberId: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {MEMBERS.filter((m) => m.user.status === "active").map((m) => (
                    <option key={m.id} value={m.id}>{m.user.name} ({m.creditBalance} cr)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duracion</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration: +e.target.value })}
                >
                  <option value={1}>1 hora</option>
                  <option value={1.5}>1.5 horas</option>
                  <option value={2}>2 horas</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Dialog.Close asChild>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancelar</button>
              </Dialog.Close>
              <button
                onClick={handleCreateBooking}
                disabled={!bookingForm.memberId}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50"
              >
                Reservar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
