import { useEffect, useState } from "react";
import {
  generateSlots,
  getCourtTypeLabel,
  getCurrentVersion,
  getMemberByUserId,
} from "@/lib/mock-data";
import type { TimeSlot } from "@/lib/mock-data";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import { useSedeStore } from "@/store/sedeStore";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import PadelIcon from "@/components/PadelIcon";
import SedeSelector from "@/components/SedeSelector";

function formatDate(d: Date) {
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

export default function BookCourtPage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const member = user ? getMemberByUserId(user.id) : undefined;
  const { selectedSede, setSelectedSede } = useSedeStore();

  const activeCourts = td.courts.filter((c) => c.isActive && (!selectedSede || c.sedeId === selectedSede));

  const [creditBalance, setCreditBalance] = useState(member?.creditBalance ?? 0);
  const [selectedCourt, setSelectedCourt] = useState(activeCourts[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date());
  const [confirming, setConfirming] = useState<TimeSlot | null>(null);
  const [booked, setBooked] = useState<TimeSlot | null>(null);

  // Auto-dismiss success banner after 4 seconds
  useEffect(() => {
    if (!booked) return;
    const timer = setTimeout(() => setBooked(null), 4000);
    return () => clearTimeout(timer);
  }, [booked]);

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const currentHour = now.getHours();

  const slots = generateSlots(date, selectedCourt).map((slot) => {
    // Mark past hours as unavailable on today
    if (isToday) {
      const slotHour = parseInt(slot.startTime.split(":")[0], 10);
      if (slotHour <= currentHour) {
        return { ...slot, available: false };
      }
    }
    return slot;
  });

  function prevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    // Allow today but not before
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) setDate(d);
  }

  function nextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  }

  function handleConfirm(slot: TimeSlot) {
    setCreditBalance((prev) => Math.max(0, prev - slot.creditsCost));
    setBooked(slot);
    setConfirming(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservar cancha</h1>
        <p className="text-sm text-gray-500 mt-1">
          Saldo disponible:{" "}
          <span className="font-semibold text-blue-500">{creditBalance} creditos</span>
        </p>
      </div>

      {/* Sede selector (only if multiple sedes) */}
      {td.hasMultipleSedes && (
        <SedeSelector
          sedes={td.sedes}
          selected={selectedSede}
          onChange={(id) => {
            setSelectedSede(id);
            setBooked(null);
            setConfirming(null);
          }}
        />
      )}

      {/* Court selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {activeCourts.map((court) => {
          const v = getCurrentVersion(court);
          return (
            <button
              key={court.id}
              onClick={() => { setSelectedCourt(court.id); setBooked(null); setConfirming(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
                selectedCourt === court.id
                  ? "border-blue-300 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <PadelIcon className="w-4 h-4" />
              {v.name}
              <span className="text-xs text-gray-400">({getCourtTypeLabel(v.type)})</span>
            </button>
          );
        })}
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevDay}
          aria-label="Dia anterior"
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-900 capitalize flex-1 text-center">
          {formatDate(date)}
        </span>
        <button
          onClick={nextDay}
          aria-label="Dia siguiente"
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Success banner */}
      {booked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in-0 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Reserva confirmada</p>
              <p className="text-xs text-emerald-600">
                {booked.startTime}–{booked.endTime} &middot; {booked.creditsCost} creditos deducidos
              </p>
            </div>
          </div>
          <Link
            to="/my-bookings"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Ver mis reservas
          </Link>
        </div>
      )}

      {/* Time slots grid */}
      <div className={`grid gap-2 ${
        slots.length > 16
          ? "grid-cols-3 sm:grid-cols-6 lg:grid-cols-10"
          : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
      }`}>
        {slots.map((slot) => {
          const canAfford = creditBalance >= slot.creditsCost;
          const isConfirming = confirming?.startTime === slot.startTime;
          return (
            <button
              key={slot.startTime}
              disabled={!slot.available || !canAfford}
              onClick={() =>
                isConfirming ? handleConfirm(slot) : setConfirming(slot)
              }
              className={`rounded-xl border p-3 text-center transition-all ${
                isConfirming
                  ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300"
                  : slot.available && canAfford
                    ? "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">
                {slot.startTime}
              </p>
              <p className="text-xs text-gray-500">{slot.endTime}</p>
              {slot.durationMinutes !== 60 && (
                <p className="text-[10px] text-gray-400">{slot.durationMinutes} min</p>
              )}
              <p
                className={`text-xs font-medium mt-1 ${
                  slot.available ? "text-blue-800" : "text-red-400"
                }`}
              >
                {slot.available ? `${slot.creditsCost} cr` : "Ocupado"}
              </p>
              {isConfirming && (
                <p className="text-[10px] text-blue-900 font-semibold mt-1">
                  Click para confirmar
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm hint */}
      {confirming && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <p className="text-blue-950">
            <strong>Confirmar reserva:</strong>{" "}
            {(() => { const c = activeCourts.find((ct) => ct.id === selectedCourt); return c ? getCurrentVersion(c).name : ""; })()} &middot;{" "}
            {confirming.startTime}–{confirming.endTime} &middot;{" "}
            <strong>{confirming.creditsCost} creditos</strong>
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Haz click en el slot otra vez para confirmar, o selecciona otro horario.
          </p>
        </div>
      )}
    </div>
  );
}
