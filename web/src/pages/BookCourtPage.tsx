import { useEffect, useMemo, useState } from "react";
import { getCourtTypeLabel, getCurrentVersion, getSportLabel, getSportEmoji } from "@/lib/domain";
import type { Member } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import { useSedeStore } from "@/store/sedeStore";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle, MapPin, Clock, Filter } from "lucide-react";
import PadelIcon from "@/components/PadelIcon";
import SedeSelector from "@/components/SedeSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  creditsCost: number | null;
  durationMinutes?: number;
}

interface CourtSlots {
  courtId: string;
  courtName: string;
  courtType: string;
  sport: string;
  sedeId: string | null;
  sedeName: string | null;
  priceMultiplier: number;
  slots: TimeSlot[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getUpcomingDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookCourtPage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const { selectedSede, setSelectedSede } = useSedeStore();

  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(0);

  // ── Filters ─────────────────────────────────────────────────────────────────

  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  // ── Availability data (fetched per sport+date change) ──────────────────────

  const [courtSlots, setCourtSlots] = useState<CourtSlots[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // ── Booking state ──────────────────────────────────────────────────────────

  const [confirming, setConfirming] = useState<string | null>(null); // courtId
  const [booked, setBooked] = useState<{ courtName: string; time: string; cost: number } | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const upcomingDays = useMemo(() => getUpcomingDays(14), []);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // ── Fetch member ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { setMemberLoading(false); return; }
    let cancelled = false;
    api.get<{ data: Member }>("/v1/members/me").then((res) => {
      if (!cancelled) { setMember(res.data); setCreditBalance(res.data.creditBalance); }
    }).catch(() => {
      if (!cancelled) setMember(null);
    }).finally(() => {
      if (!cancelled) setMemberLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  // ── Derived: courts filtered by sede ──────────────────────────────────────

  const activeCourts = useMemo(
    () => td.courts.filter((c) => c.isActive && (!selectedSede || c.sedeId === selectedSede)),
    [td.courts, selectedSede]
  );

  // ── Derived: available sports with court counts ───────────────────────────

  const sportsWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of activeCourts) {
      const v = getCurrentVersion(c);
      const sport = v.sport as string;
      map.set(sport, (map.get(sport) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([sport, count]) => ({ sport, count }));
  }, [activeCourts]);

  // Auto-select sport
  useEffect(() => {
    if (sportsWithCounts.length > 0) {
      if (!selectedSport || !sportsWithCounts.find((s) => s.sport === selectedSport)) {
        setSelectedSport(sportsWithCounts[0].sport);
      }
    }
  }, [sportsWithCounts, selectedSport]);

  // ── Derived: courts for selected sport ────────────────────────────────────

  const courtsForSport = useMemo(
    () => activeCourts.filter((c) => {
      const v = getCurrentVersion(c);
      return (v.sport as string) === selectedSport;
    }),
    [activeCourts, selectedSport]
  );

  // ── Fetch availability when sport or date changes ─────────────────────────

  useEffect(() => {
    if (!selectedSport || courtsForSport.length === 0) {
      setCourtSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSelectedHour(null);
    setConfirming(null);

    const dateStr = toDateStr(selectedDate);

    Promise.all(
      courtsForSport.map(async (court) => {
        try {
          const res = await api.get<{ data: TimeSlot[] }>(`/v1/courts/${court.id}/availability?date=${dateStr}`);
          const v = getCurrentVersion(court);
          const sede = court.sedeId ? td.sedes.find((s) => s.id === court.sedeId) : null;
          return {
            courtId: court.id,
            courtName: v.name as string,
            courtType: v.type as string,
            sport: v.sport as string,
            sedeId: court.sedeId,
            sedeName: sede?.name ?? null,
            priceMultiplier: (v as { priceMultiplier?: number }).priceMultiplier ?? 1,
            slots: res.data,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setCourtSlots(results.filter(Boolean) as CourtSlots[]);
        setSlotsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedSport, selectedDate, courtsForSport.map((c) => c.id).join(",")]);

  // ── Derived: available hours (at least 1 court has this hour available) ───

  const hourAvailability = useMemo(() => {
    const map = new Map<string, { available: boolean; courtCount: number; minPrice: number }>();

    for (const cs of courtSlots) {
      for (const slot of cs.slots) {
        const existing = map.get(slot.startTime);
        if (!existing) {
          map.set(slot.startTime, {
            available: slot.available,
            courtCount: slot.available ? 1 : 0,
            minPrice: slot.available ? (slot.creditsCost ?? 0) : Infinity,
          });
        } else {
          if (slot.available) {
            existing.available = true;
            existing.courtCount++;
            existing.minPrice = Math.min(existing.minPrice, slot.creditsCost ?? 0);
          }
        }
      }
    }

    return map;
  }, [courtSlots]);

  const sortedHours = useMemo(
    () => Array.from(hourAvailability.entries()).sort(([a], [b]) => a.localeCompare(b)),
    [hourAvailability]
  );

  // ── Derived: courts available at selected hour ────────────────────────────

  const availableCourts = useMemo(() => {
    if (!selectedHour) return [];
    return courtSlots
      .map((cs) => {
        const slot = cs.slots.find((s) => s.startTime === selectedHour && s.available);
        if (!slot) return null;
        return { ...cs, matchedSlot: slot };
      })
      .filter(Boolean) as (CourtSlots & { matchedSlot: TimeSlot })[];
  }, [courtSlots, selectedHour]);

  // ── Auto-dismiss booked ───────────────────────────────────────────────────

  useEffect(() => {
    if (!booked) return;
    const t = setTimeout(() => setBooked(null), 5000);
    return () => clearTimeout(t);
  }, [booked]);

  // ── Book ──────────────────────────────────────────────────────────────────

  async function handleBook(court: CourtSlots & { matchedSlot: TimeSlot }) {
    if (bookingInProgress) return;
    setBookingInProgress(true);
    try {
      const dateStr = toDateStr(selectedDate);
      await api.post("/v1/bookings", {
        courtId: court.courtId,
        startTime: `${dateStr}T${court.matchedSlot.startTime}:00`,
        endTime: `${dateStr}T${court.matchedSlot.endTime}:00`,
      });
      const cost = court.matchedSlot.creditsCost ?? 0;
      setCreditBalance((prev) => Math.max(0, prev - cost));
      setBooked({ courtName: court.courtName, time: `${court.matchedSlot.startTime}–${court.matchedSlot.endTime}`, cost });
      setConfirming(null);
      setSelectedHour(null);
      td.refetch();
    } catch {
      // error
    } finally {
      setBookingInProgress(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (memberLoading || td.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <PadelIcon className="w-12 h-12 text-gray-300 animate-pulse" />
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <PadelIcon className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">No se encontro tu perfil de socio.</p>
        <p className="text-sm text-gray-400">Contacta al administrador del club.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservar</h1>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-right">
          <p className="text-lg font-bold text-blue-800">{creditBalance} <span className="text-xs font-medium">cr</span></p>
          <p className="text-[10px] text-blue-500">Saldo disponible</p>
        </div>
      </div>

      {/* Success */}
      {booked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Reserva confirmada</p>
              <p className="text-xs text-emerald-600">{booked.courtName} · {booked.time} · {booked.cost} cr</p>
            </div>
          </div>
          <Link to="/my-bookings" className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
            Ver reservas
          </Link>
        </div>
      )}

      {/* Sede */}
      {td.hasMultipleSedes && (
        <SedeSelector
          sedes={td.sedes}
          selected={selectedSede}
          onChange={(id) => { setSelectedSede(id); setSelectedHour(null); setConfirming(null); }}
        />
      )}

      {/* ── FILTER 1: Sport ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          <Filter className="w-3 h-3 inline -mt-0.5 mr-1" />
          Deporte
        </label>
        <div className="flex gap-2 flex-wrap">
          {sportsWithCounts.map(({ sport, count }) => (
            <button
              key={sport}
              onClick={() => { setSelectedSport(sport); setSelectedHour(null); setConfirming(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                selectedSport === sport
                  ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{getSportEmoji(sport)}</span>
              {getSportLabel(sport)}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                selectedSport === sport ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          ))}
          {sportsWithCounts.length === 0 && (
            <p className="text-sm text-gray-400">No hay canchas activas</p>
          )}
        </div>
      </div>

      {/* ── FILTER 2: Date ───────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {upcomingDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            return (
              <button
                key={day.toISOString()}
                onClick={() => { setSelectedDate(day); setSelectedHour(null); setConfirming(null); }}
                className={`flex flex-col items-center min-w-[60px] px-3 py-2.5 rounded-xl border text-center transition-all shrink-0 ${
                  isSelected
                    ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? "text-blue-600" : "text-gray-400"}`}>
                  {isToday ? "Hoy" : DAY_NAMES[day.getDay()]}
                </span>
                <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                <span className={`text-[10px] ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
                  {MONTH_NAMES[day.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER 3: Hour (cascaded — only available hours are active) ─── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Hora
          {slotsLoading && <span className="ml-2 text-blue-500 font-normal normal-case">cargando...</span>}
        </label>

        {slotsLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : sortedHours.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
            <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin horarios disponibles</p>
            <p className="text-xs text-gray-400 mt-0.5">Prueba otra fecha o deporte</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {sortedHours.map(([hour, info]) => {
              const isSelected = selectedHour === hour;
              const isAvailable = info.available;

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (!isAvailable) return;
                    setSelectedHour(isSelected ? null : hour);
                    setConfirming(null);
                  }}
                  disabled={!isAvailable}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-200"
                      : isAvailable
                        ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className={`text-sm font-bold ${!isAvailable ? "text-gray-300" : ""}`}>{hour}</span>
                  {isAvailable ? (
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      isSelected ? "text-blue-600" : "text-emerald-600"
                    }`}>
                      {info.courtCount} {info.courtCount === 1 ? "cancha" : "canchas"}
                    </span>
                  ) : (
                    <span className="text-[10px] mt-0.5 text-gray-300">No disp.</span>
                  )}
                  {isAvailable && (
                    <span className={`text-[10px] ${isSelected ? "text-blue-500" : "text-gray-400"}`}>
                      {info.minPrice === Infinity ? "" : `${info.minPrice} cr`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESULTS: Courts at selected hour (inline, no separate step) ─── */}
      {selectedHour && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Canchas disponibles a las {selectedHour}
          </label>

          {availableCourts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <PadelIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No hay canchas disponibles a esta hora</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableCourts.map((court) => {
                const cost = court.matchedSlot.creditsCost ?? 0;
                const canAfford = creditBalance >= cost;
                const isConfirming = confirming === court.courtId;

                return (
                  <div
                    key={court.courtId}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      isConfirming ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isConfirming ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <PadelIcon className={`w-5 h-5 ${isConfirming ? "text-blue-600" : "text-gray-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{court.courtName}</p>
                          <p className="text-xs text-gray-400">
                            {getCourtTypeLabel(court.courtType)}
                            {court.sedeName && <> · <MapPin className="w-3 h-3 inline -mt-0.5" /> {court.sedeName}</>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">{cost} <span className="text-xs font-medium text-gray-400">cr</span></p>
                        <p className="text-[10px] text-gray-400">{court.matchedSlot.startTime}–{court.matchedSlot.endTime}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {!canAfford ? (
                        <p className="text-xs text-red-500 text-center py-2 bg-red-50 rounded-lg">Saldo insuficiente ({cost} cr necesarios)</p>
                      ) : isConfirming ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirming(null)}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleBook(court)}
                            disabled={bookingInProgress}
                            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {bookingInProgress ? "Reservando..." : "Confirmar reserva"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirming(court.courtId)}
                          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                        >
                          Reservar — {cost} cr
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
