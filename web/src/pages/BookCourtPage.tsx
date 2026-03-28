import { useEffect, useMemo, useState } from "react";
import { getCourtTypeLabel, getCurrentVersion, getSportLabel, getSportEmoji } from "@/lib/domain";
import type { Member } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import { useSedeStore } from "@/store/sedeStore";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
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

interface CourtAvailability {
  courtId: string;
  courtName: string;
  courtType: string;
  sport: string;
  sedeId: string | null;
  sedeName: string | null;
  priceMultiplier: number;
  slot: TimeSlot;
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

// Generate the next N days starting from today
function getUpcomingDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Generate hour options (e.g., 6:00, 6:30, 7:00...) for a range
function generateHourOptions(startHour: number, endHour: number, stepMinutes: number): string[] {
  const options: string[] = [];
  for (let min = startHour * 60; min < endHour * 60; min += stepMinutes) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return options;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookCourtPage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const { selectedSede, setSelectedSede } = useSedeStore();

  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);

  // Fetch current member from API
  useEffect(() => {
    if (!user) { setMemberLoading(false); return; }
    let cancelled = false;
    api.get<{ data: Member }>("/v1/members/me").then((res) => {
      if (!cancelled) setMember(res.data);
    }).catch(() => {
      if (!cancelled) setMember(null);
    }).finally(() => {
      if (!cancelled) setMemberLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Auto-select first sede
  useEffect(() => {
    if (td.hasMultipleSedes && !selectedSede && td.sedes.length > 0) {
      setSelectedSede(td.sedes[0].id);
    }
  }, [td.hasMultipleSedes, td.sedes, selectedSede, setSelectedSede]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const activeCourts = td.courts.filter((c) => c.isActive && (!selectedSede || c.sedeId === selectedSede));

  // Available sports from active courts
  const sports = useMemo(() => {
    const set = new Set<string>();
    for (const c of activeCourts) {
      const v = getCurrentVersion(c);
      set.add(v.sport as string);
    }
    return Array.from(set);
  }, [activeCourts]);

  // Duration options from schedule config
  const durationOptions = useMemo(() => {
    const config = td.availabilityConfig;
    if (config && typeof config === "object" && "minBookingDurationMinutes" in config) {
      const min = (config as { minBookingDurationMinutes: number }).minBookingDurationMinutes;
      // Offer the minimum and common multiples
      const opts = new Set([min]);
      if (min <= 60) opts.add(60);
      if (min <= 60) opts.add(90);
      if (min <= 30) opts.add(120);
      return Array.from(opts).sort((a, b) => a - b);
    }
    return [60, 90];
  }, [td.availabilityConfig]);

  // ── State ───────────────────────────────────────────────────────────────────

  const [creditBalance, setCreditBalance] = useState(0);
  const [selectedSport, setSelectedSport] = useState(sports[0] ?? "padel");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0] ?? 60);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "results">("select");

  // Results state
  const [results, setResults] = useState<CourtAvailability[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [confirming, setConfirming] = useState<CourtAvailability | null>(null);
  const [booked, setBooked] = useState<CourtAvailability | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const upcomingDays = useMemo(() => getUpcomingDays(14), []);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Available start hours (6:00–21:00 with 30min step, filter past hours for today)
  const hourOptions = useMemo(() => {
    const all = generateHourOptions(6, 22, 30);
    if (isSameDay(selectedDate, today)) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return all.filter((h) => {
        const [hh, mm] = h.split(":").map(Number);
        return hh * 60 + mm > currentMinutes;
      });
    }
    return all;
  }, [selectedDate, today]);

  // Sync
  useEffect(() => { if (member) setCreditBalance(member.creditBalance); }, [member]);
  useEffect(() => { if (sports.length > 0 && !sports.includes(selectedSport)) setSelectedSport(sports[0]); }, [sports, selectedSport]);
  useEffect(() => { if (!durationOptions.includes(selectedDuration)) setSelectedDuration(durationOptions[0]); }, [durationOptions, selectedDuration]);

  // Auto-dismiss success
  useEffect(() => {
    if (!booked) return;
    const timer = setTimeout(() => setBooked(null), 5000);
    return () => clearTimeout(timer);
  }, [booked]);

  // ── Search for available courts ─────────────────────────────────────────────

  async function searchAvailability() {
    if (!selectedHour) return;
    setResultsLoading(true);
    setStep("results");
    setConfirming(null);

    try {
      const dateStr = toDateStr(selectedDate);
      // Fetch availability for all courts matching sport + sede, then filter client-side
      const courtsForSport = activeCourts.filter((c) => {
        const v = getCurrentVersion(c);
        return (v.sport as string) === selectedSport;
      });

      const availableResults: CourtAvailability[] = [];

      for (const court of courtsForSport) {
        try {
          const res = await api.get<{ data: TimeSlot[] }>(`/v1/courts/${court.id}/availability?date=${dateStr}`);
          const v = getCurrentVersion(court);
          const sede = court.sedeId ? td.sedes.find((s) => s.id === court.sedeId) : null;

          // Find a slot matching the selected hour
          const matchingSlot = res.data.find((s) => s.startTime === selectedHour && s.available);
          if (matchingSlot) {
            availableResults.push({
              courtId: court.id,
              courtName: v.name as string,
              courtType: v.type as string,
              sport: v.sport as string,
              sedeId: court.sedeId,
              sedeName: sede?.name ?? null,
              priceMultiplier: (v as { priceMultiplier?: number }).priceMultiplier ?? 1,
              slot: matchingSlot,
            });
          }
        } catch {
          // Skip courts that error
        }
      }

      setResults(availableResults);
    } catch {
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }

  // ── Book ────────────────────────────────────────────────────────────────────

  async function handleBook(result: CourtAvailability) {
    if (bookingInProgress) return;
    setBookingInProgress(true);
    try {
      const dateStr = toDateStr(selectedDate);
      await api.post("/v1/bookings", {
        courtId: result.courtId,
        startTime: `${dateStr}T${result.slot.startTime}:00`,
        endTime: `${dateStr}T${result.slot.endTime}:00`,
      });
      setCreditBalance((prev) => Math.max(0, prev - (result.slot.creditsCost ?? 0)));
      setBooked(result);
      setConfirming(null);
      td.refetch();
    } catch {
      // error handling
    } finally {
      setBookingInProgress(false);
    }
  }

  // ── Loading / Error states ──────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservar</h1>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-right">
          <p className="text-lg font-bold text-blue-800">{creditBalance} <span className="text-xs font-medium">cr</span></p>
          <p className="text-[10px] text-blue-500">Saldo disponible</p>
        </div>
      </div>

      {/* Success banner */}
      {booked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in-0 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Reserva confirmada</p>
              <p className="text-xs text-emerald-600">
                {booked.courtName} · {booked.slot.startTime}–{booked.slot.endTime} · {booked.slot.creditsCost} cr
                {booked.sedeName && <> · <MapPin className="w-3 h-3 inline -mt-0.5" /> {booked.sedeName}</>}
              </p>
            </div>
          </div>
          <Link
            to="/my-bookings"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Ver reservas
          </Link>
        </div>
      )}

      {/* Sede selector */}
      {td.hasMultipleSedes && (
        <SedeSelector
          sedes={td.sedes}
          selected={selectedSede}
          onChange={(id) => {
            setSelectedSede(id);
            setStep("select");
            setSelectedHour(null);
          }}
        />
      )}

      {/* ── STEP 1: Selection ──────────────────────────────────────────────── */}
      {step === "select" && (
        <>
          {/* Sport selector */}
          {sports.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deporte</label>
              <div className="flex gap-2 flex-wrap">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      selectedSport === sport
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{getSportEmoji(sport)}</span>
                    {getSportLabel(sport)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date selector — horizontal scroll */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fecha</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {upcomingDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDate(day); setSelectedHour(null); }}
                    className={`flex flex-col items-center min-w-[60px] px-3 py-2.5 rounded-xl border text-center transition-colors shrink-0 ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 text-blue-900"
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

          {/* Duration selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duración</label>
            <div className="flex gap-2">
              {durationOptions.map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSelectedDuration(dur)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    selectedDuration === dur
                      ? "border-blue-300 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}m` : ""}` : `${dur} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Hour selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hora</label>
            {hourOptions.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No hay horarios disponibles para hoy.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {hourOptions.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold text-center transition-colors ${
                      selectedHour === hour
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={searchAvailability}
            disabled={!selectedHour}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            VER CANCHAS DISPONIBLES
          </button>
        </>
      )}

      {/* ── STEP 2: Results ────────────────────────────────────────────────── */}
      {step === "results" && (
        <>
          {/* Back + summary */}
          <button
            onClick={() => { setStep("select"); setConfirming(null); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Cambiar búsqueda
          </button>

          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap text-sm">
            <span className="font-medium text-gray-900">
              {getSportEmoji(selectedSport)} {getSportLabel(selectedSport)}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-600">
              {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-600">
              <Clock className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" />
              {selectedHour} · {selectedDuration} min
            </span>
          </div>

          {resultsLoading ? (
            <div className="text-center py-12">
              <PadelIcon className="w-8 h-8 text-gray-300 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-gray-400">Buscando canchas disponibles...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <PadelIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No hay canchas disponibles</p>
              <p className="text-xs text-gray-400 mt-1">Prueba con otro horario o fecha.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{results.length} cancha{results.length !== 1 ? "s" : ""} disponible{results.length !== 1 ? "s" : ""}</p>
              {results.map((r) => {
                const cost = r.slot.creditsCost ?? 0;
                const canAfford = creditBalance >= cost;
                const isConfirmingThis = confirming?.courtId === r.courtId;

                return (
                  <div
                    key={r.courtId}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      isConfirmingThis
                        ? "border-blue-400 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <PadelIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{r.courtName}</p>
                          <p className="text-xs text-gray-400">
                            {getCourtTypeLabel(r.courtType)}
                            {r.sedeName && <> · <MapPin className="w-3 h-3 inline -mt-0.5" /> {r.sedeName}</>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">{cost} <span className="text-xs font-medium text-gray-400">cr</span></p>
                        <p className="text-[10px] text-gray-400">{r.slot.startTime}–{r.slot.endTime}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-3">
                      {!canAfford ? (
                        <p className="text-xs text-red-500 text-center py-2">Saldo insuficiente</p>
                      ) : isConfirmingThis ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirming(null)}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleBook(r)}
                            disabled={bookingInProgress}
                            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {bookingInProgress ? "Reservando..." : "Confirmar reserva"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirming(r)}
                          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
