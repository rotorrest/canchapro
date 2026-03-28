import { useState, useMemo } from "react";
import { useTenantData } from "@/hooks/useTenantData";
import { getCurrentVersion } from "@/lib/domain";

// ── Local types (schedule system) ───────────────────────────────────────────

interface ScheduleTimeRange {
  id: string;
  startTime: string;
  endTime: string;
  pricePerSlot: number;
}

interface ScheduleDayConfig {
  dayOfWeek: number;
  isClosed: boolean;
  timeRanges: ScheduleTimeRange[];
}

interface ScheduleVersion {
  id: string;
  scheduleId: string;
  version: number;
  slotDurationMinutes: number;
  minBookingDurationMinutes: number;
  days: ScheduleDayConfig[];
  courtIds: string[];
  createdAt: string;
  changedBy: string;
  reason: string;
}

interface Schedule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isActive: boolean;
  versions: ScheduleVersion[];
}

function getCurrentScheduleVersion(schedule: Schedule): ScheduleVersion {
  return schedule.versions.reduce((a, b) => (a.version > b.version ? a : b));
}
import {
  ChevronUp,
  Clock,
  History,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import PadelIcon from "@/components/PadelIcon";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
];

const MIN_BOOKING_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

const HOUR_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    HOUR_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// ── Form types ────────────────────────────────────────────────────────────────

interface RangeForm {
  id: string;
  startTime: string;
  endTime: string;
  pricePerSlot: number;
}

interface DayForm {
  dayOfWeek: number;
  isClosed: boolean;
  timeRanges: RangeForm[];
}

interface ScheduleForm {
  name: string;
  description: string;
  slotDurationMinutes: number;
  minBookingDurationMinutes: number;
  courtIds: string[];
  days: DayForm[];
  reason: string;
}

function defaultDays(): DayForm[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isClosed: false,
    timeRanges: [
      { id: `nr-${i}-0`, startTime: i < 5 ? "06:00" : "07:00", endTime: "12:00", pricePerSlot: 1 },
      { id: `nr-${i}-1`, startTime: "12:00", endTime: "18:00", pricePerSlot: 1.5 },
      { id: `nr-${i}-2`, startTime: "18:00", endTime: "22:00", pricePerSlot: 2 },
    ],
  }));
}

function versionToDays(v: ScheduleVersion): DayForm[] {
  return v.days.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    isClosed: d.isClosed,
    timeRanges: d.timeRanges.map((r) => ({ ...r })),
  }));
}

const EMPTY_FORM: ScheduleForm = {
  name: "",
  description: "",
  slotDurationMinutes: 60,
  minBookingDurationMinutes: 60,
  courtIds: [],
  days: defaultDays(),
  reason: "",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulesPage() {
  const td = useTenantData();
  const [schedules, setSchedules] = useState<Schedule[]>(td.schedules);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [activeDay, setActiveDay] = useState(0);

  const activeCourts = useMemo(
    () => td.courts.filter((c) => c.isActive),
    [td.courts]
  );

  // Which courts are already assigned to another schedule
  const assignedCourtIds = useMemo(() => {
    const map = new Map<string, string>(); // courtId → scheduleId
    for (const s of schedules) {
      if (!s.isActive) continue;
      const v = getCurrentScheduleVersion(s);
      for (const cid of v.courtIds) {
        map.set(cid, s.id);
      }
    }
    return map;
  }, [schedules]);

  // ── Open add ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setActiveDay(0);
    setModalOpen(true);
  }

  // ── Open edit ──────────────────────────────────────────────────────────────

  function openEdit(schedule: Schedule) {
    const v = getCurrentScheduleVersion(schedule);
    setEditingId(schedule.id);
    setForm({
      name: schedule.name,
      description: schedule.description,
      slotDurationMinutes: v.slotDurationMinutes,
      minBookingDurationMinutes: v.minBookingDurationMinutes,
      courtIds: [...v.courtIds],
      days: versionToDays(v),
      reason: "",
    });
    setActiveDay(0);
    setModalOpen(true);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    const days: ScheduleDayConfig[] = form.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      isClosed: d.isClosed,
      timeRanges: d.timeRanges.map((r) => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        pricePerSlot: r.pricePerSlot,
      })),
    }));

    if (editingId) {
      setSchedules(
        schedules.map((s) => {
          if (s.id !== editingId) return s;
          const prevV = getCurrentScheduleVersion(s);
          const newVersion: ScheduleVersion = {
            id: `schv-${Date.now()}`,
            scheduleId: s.id,
            version: prevV.version + 1,
            slotDurationMinutes: form.slotDurationMinutes,
            minBookingDurationMinutes: form.minBookingDurationMinutes,
            courtIds: form.courtIds,
            days,
            createdAt: new Date(2026, 2, 27).toISOString(),
            changedBy: "Admin",
            reason: form.reason || "Actualización",
          };
          return {
            ...s,
            name: form.name,
            description: form.description,
            versions: [...s.versions, newVersion],
          };
        })
      );
    } else {
      const newSchedule: Schedule = {
        id: `sch-${Date.now()}`,
        tenantId: td.tenantId ?? "t1",
        name: form.name,
        description: form.description,
        isActive: true,
        versions: [
          {
            id: `schv-${Date.now()}`,
            scheduleId: `sch-${Date.now()}`,
            version: 1,
            slotDurationMinutes: form.slotDurationMinutes,
            minBookingDurationMinutes: form.minBookingDurationMinutes,
            courtIds: form.courtIds,
            days,
            createdAt: new Date(2026, 2, 27).toISOString(),
            changedBy: "Admin",
            reason: form.reason || "Creación inicial",
          },
        ],
      };
      setSchedules([...schedules, newSchedule]);
    }
    setModalOpen(false);
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  function toggleActive(id: string) {
    setSchedules(
      schedules.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  }

  // ── Day form helpers ───────────────────────────────────────────────────────

  function updateDay(dayIdx: number, patch: Partial<DayForm>) {
    setForm({
      ...form,
      days: form.days.map((d, i) => (i === dayIdx ? { ...d, ...patch } : d)),
    });
  }

  function addRange(dayIdx: number) {
    const day = form.days[dayIdx];
    const lastRange = day.timeRanges[day.timeRanges.length - 1];
    const newR: RangeForm = {
      id: `nr-${Date.now()}`,
      startTime: lastRange?.endTime ?? "08:00",
      endTime: "22:00",
      pricePerSlot: lastRange?.pricePerSlot ?? 1,
    };
    updateDay(dayIdx, { timeRanges: [...day.timeRanges, newR] });
  }

  function updateRange(dayIdx: number, rangeIdx: number, patch: Partial<RangeForm>) {
    const day = form.days[dayIdx];
    updateDay(dayIdx, {
      timeRanges: day.timeRanges.map((r, i) => (i === rangeIdx ? { ...r, ...patch } : r)),
    });
  }

  function removeRange(dayIdx: number, rangeIdx: number) {
    const day = form.days[dayIdx];
    updateDay(dayIdx, {
      timeRanges: day.timeRanges.filter((_, i) => i !== rangeIdx),
    });
  }

  // ── Copy day config ────────────────────────────────────────────────────────

  function copyToAll(dayIdx: number) {
    const src = form.days[dayIdx];
    setForm({
      ...form,
      days: form.days.map((d) => ({
        ...d,
        isClosed: src.isClosed,
        timeRanges: src.timeRanges.map((r) => ({ ...r, id: `nr-${d.dayOfWeek}-${Math.random()}` })),
      })),
    });
  }

  function copyToWeekdays(dayIdx: number) {
    const src = form.days[dayIdx];
    setForm({
      ...form,
      days: form.days.map((d) =>
        d.dayOfWeek < 5
          ? {
              ...d,
              isClosed: src.isClosed,
              timeRanges: src.timeRanges.map((r) => ({ ...r, id: `nr-${d.dayOfWeek}-${Math.random()}` })),
            }
          : d
      ),
    });
  }

  // ── Court toggle in form ───────────────────────────────────────────────────

  function toggleCourt(courtId: string) {
    setForm({
      ...form,
      courtIds: form.courtIds.includes(courtId)
        ? form.courtIds.filter((id) => id !== courtId)
        : [...form.courtIds, courtId],
    });
  }

  const canSave = form.name.trim() && form.courtIds.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo horario
        </button>
      </div>

      {schedules.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay horarios configurados.</p>
          <p className="text-gray-400 text-xs mt-1">Crea un horario para definir disponibilidad y precios.</p>
        </div>
      )}

      {/* ── Schedule cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {schedules.map((schedule) => {
          const v = getCurrentScheduleVersion(schedule);
          const isExpanded = expandedId === schedule.id;
          const histOpen = expandedHistory === schedule.id;

          return (
            <div key={schedule.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header — clickable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{schedule.name}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        schedule.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {schedule.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <span className="text-[10px] text-gray-400">v{v.version}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {v.courtIds.map((cid) => {
                      const court = td.courts.find((c) => c.id === cid);
                      const name = court ? getCurrentVersion(court).name : cid;
                      return (
                        <span key={cid} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {name}
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-gray-400 ml-1">
                      · {v.minBookingDurationMinutes} min mínimo · Bloques de {v.slotDurationMinutes} min
                    </span>
                  </div>
                </div>
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${!isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Day schedule table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-2.5 font-medium text-gray-500 w-24">Día</th>
                          <th className="text-left px-5 py-2.5 font-medium text-gray-500">Rangos horarios</th>
                          <th className="text-center px-5 py-2.5 font-medium text-gray-500 w-20">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {v.days
                          .slice()
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((day) => (
                            <tr key={day.dayOfWeek} className={day.isClosed ? "opacity-50" : ""}>
                              <td className="px-5 py-2.5 font-medium text-gray-700">
                                {DAY_SHORT[day.dayOfWeek]}
                              </td>
                              <td className="px-5 py-2.5">
                                {day.isClosed ? (
                                  <span className="text-gray-400 text-xs">Cerrado</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {day.timeRanges.map((r) => (
                                      <span
                                        key={r.id}
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700"
                                      >
                                        {r.startTime}–{r.endTime}
                                        <span className="font-semibold">{r.pricePerSlot} cr</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-2.5 text-center">
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    day.isClosed
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {day.isClosed ? "Cerrado" : "Abierto"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Version history toggle */}
                  {schedule.versions.length > 1 && (
                    <div className="border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedHistory(histOpen ? null : schedule.id);
                        }}
                        className="w-full px-5 py-2.5 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                      >
                        <History className="w-3.5 h-3.5" />
                        {histOpen ? "Ocultar historial" : `Ver historial (${schedule.versions.length} versiones)`}
                      </button>
                      {histOpen && (
                        <div className="px-5 pb-4 space-y-2">
                          {schedule.versions
                            .slice()
                            .sort((a, b) => b.version - a.version)
                            .map((ver) => (
                              <div key={ver.id} className="relative pl-4 border-l-2 border-gray-200">
                                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300" />
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">v{ver.version}</span>
                                  <span>·</span>
                                  <span>{new Date(ver.createdAt).toLocaleDateString("es-PE")}</span>
                                  <span>·</span>
                                  <span>{ver.changedBy}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{ver.reason}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => toggleActive(schedule.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        schedule.isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {schedule.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => openEdit(schedule)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-blue-700 hover:bg-blue-50 font-medium transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal: Create / Edit Schedule ─────────────────────────────────── */}
      <Dialog.Root
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) setModalOpen(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                {editingId ? "Editar horario" : "Nuevo horario"}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Configurar horario de operación
            </Dialog.Description>

            {/* Body — scrollable */}
            <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
              {/* Name + description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej. Horario regular"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Horario estándar"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Duration settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Granularidad (bloques)</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.slotDurationMinutes}
                    onChange={(e) => setForm({ ...form, slotDurationMinutes: +e.target.value })}
                  >
                    {SLOT_DURATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Cada cuánto inicia un bloque en la grilla</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reserva mínima</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.minBookingDurationMinutes}
                    onChange={(e) => setForm({ ...form, minBookingDurationMinutes: +e.target.value })}
                  >
                    {MIN_BOOKING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Tiempo mínimo que un socio puede reservar</p>
                </div>
              </div>

              {/* Court assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canchas asignadas</label>
                <div className="flex flex-wrap gap-2">
                  {activeCourts.map((court) => {
                    const name = getCurrentVersion(court).name;
                    const selected = form.courtIds.includes(court.id);
                    const assignedTo = assignedCourtIds.get(court.id);
                    const assignedElsewhere = assignedTo && assignedTo !== editingId;
                    const otherScheduleName = assignedElsewhere
                      ? schedules.find((s) => s.id === assignedTo)?.name
                      : null;

                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => toggleCourt(court.id)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          selected
                            ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        title={assignedElsewhere ? `Asignada a "${otherScheduleName}"` : undefined}
                      >
                        <PadelIcon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        {name}
                        {assignedElsewhere && <span className="text-[9px] ml-1 text-amber-500">⚠</span>}
                      </button>
                    );
                  })}
                </div>
                {form.courtIds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Selecciona al menos una cancha</p>
                )}
              </div>

              {/* Day configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Configuración por día</label>

                {/* Day tabs */}
                <div className="flex gap-1 mb-4 border-b border-gray-200">
                  {form.days.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDay(i)}
                      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                        activeDay === i
                          ? "border-blue-700 text-blue-700"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      } ${d.isClosed ? "opacity-50" : ""}`}
                    >
                      {DAY_SHORT[i]}
                    </button>
                  ))}
                </div>

                {/* Active day config */}
                {(() => {
                  const day = form.days[activeDay];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!day.isClosed}
                            onChange={(e) => updateDay(activeDay, { isClosed: !e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {DAY_LABELS[activeDay]} — {day.isClosed ? "Cerrado" : "Abierto"}
                          </span>
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyToWeekdays(activeDay)}
                            className="text-[10px] text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50"
                          >
                            Copiar a Lun–Vie
                          </button>
                          <button
                            onClick={() => copyToAll(activeDay)}
                            className="text-[10px] text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50"
                          >
                            Copiar a todos
                          </button>
                        </div>
                      </div>

                      {!day.isClosed && (
                        <>
                          <div className="space-y-2">
                            {day.timeRanges.map((range, ri) => (
                              <div key={range.id} className="flex items-center gap-2">
                                <select
                                  value={range.startTime}
                                  onChange={(e) => updateRange(activeDay, ri, { startTime: e.target.value })}
                                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {HOUR_OPTIONS.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-400 text-sm">a</span>
                                <select
                                  value={range.endTime}
                                  onChange={(e) => updateRange(activeDay, ri, { endTime: e.target.value })}
                                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {HOUR_OPTIONS.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1 ml-1">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={range.pricePerSlot}
                                    onChange={(e) => updateRange(activeDay, ri, { pricePerSlot: +e.target.value })}
                                    className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <span className="text-xs text-gray-400">cr</span>
                                </div>
                                {day.timeRanges.length > 1 && (
                                  <button
                                    onClick={() => removeRange(activeDay, ri)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addRange(activeDay)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar rango
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Reason (only for edits) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del cambio <span className="text-gray-400 font-normal">(se guarda en el historial)</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej. Ajuste de precios de noche"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-200 shrink-0">
              <Dialog.Close className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {editingId ? "Guardar nueva versión" : "Crear horario"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
