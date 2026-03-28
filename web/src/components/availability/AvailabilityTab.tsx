import { useState, useMemo } from "react";
import { useTenantData } from "@/hooks/useTenantData";
import type { Court } from "@/hooks/useTenantData";
import { getCurrentVersion, getSportEmoji } from "@/lib/domain";

// ── Local types (availability system) ───────────────────────────────────────

interface AvailabilityConfig {
  tenantId: string;
  defaultSlotDuration: 30 | 60 | 90 | 120;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  maxBookingsPerMemberPerDay: number;
  bufferMinutes: number;
  noShowToleranceMinutes: number;
  autoCancelNoShow: boolean;
  bookingDeadlineTime: string | null;
}

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

interface SpecialDay {
  id: string;
  tenantId: string;
  date: string;
  label: string;
  isClosed: boolean;
  scheduleOverrideId: string | null;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  creditsCost: number;
  durationMinutes: number;
}

function getCurrentScheduleVersion(schedule: Schedule): ScheduleVersion {
  return schedule.versions.reduce((a, b) => (a.version > b.version ? a : b));
}

/** Stub: generateSlots will need to be replaced with an API call */
function generateSlots(_date: Date, _courtId: string): TimeSlot[] {
  return [];
}
import {
  Clock,
  Settings,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  Ban,
  Pencil,
} from "lucide-react";
import DatePicker from "@/components/DatePicker";
import { addDays } from "date-fns";

const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const SLOT_DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
];

const PRICE_COLORS = [
  { max: 1, bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { max: 1.5, bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { max: 2, bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { max: 3, bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  { max: Infinity, bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
];

function priceColor(price: number) {
  return PRICE_COLORS.find((c) => price <= c.max) ?? PRICE_COLORS[PRICE_COLORS.length - 1];
}

// ── Config Global Section ────────────────────────────────────────────────────

function ConfigSection({
  config,
  onChange,
}: {
  config: AvailabilityConfig;
  onChange: (c: AvailabilityConfig) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config);

  function save() {
    onChange(draft);
    setEditing(false);
  }

  const fields: { label: string; key: keyof AvailabilityConfig; type: "select" | "number" | "toggle" | "time"; options?: { value: number; label: string }[]; suffix?: string }[] = [
    {
      label: "Duracion del turno",
      key: "defaultSlotDuration",
      type: "select",
      options: SLOT_DURATIONS,
    },
    { label: "Antelacion minima", key: "minAdvanceMinutes", type: "number", suffix: "min" },
    { label: "Reserva anticipada max", key: "maxAdvanceDays", type: "number", suffix: "dias" },
    { label: "Max reservas / socio / dia", key: "maxBookingsPerMemberPerDay", type: "number" },
    { label: "Buffer entre turnos", key: "bufferMinutes", type: "number", suffix: "min" },
    { label: "Tolerancia no-show", key: "noShowToleranceMinutes", type: "number", suffix: "min" },
    { label: "Auto-cancelar no-show", key: "autoCancelNoShow", type: "toggle" },
  ];

  if (!editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Configuracion global</h3>
          </div>
          <button
            onClick={() => { setDraft(config); setEditing(true); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
          {fields.map((f) => {
            const val = config[f.key];
            const display =
              f.type === "toggle"
                ? val ? "Si" : "No"
                : f.type === "select"
                  ? f.options?.find((o) => o.value === val)?.label ?? val
                  : `${val}${f.suffix ? ` ${f.suffix}` : ""}`;
            return (
              <div key={f.key} className="bg-white px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{String(display)}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-blue-200 ring-1 ring-blue-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-blue-100 flex items-center justify-between bg-blue-50/50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Editando configuracion</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={save} className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
            <Check className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</label>
            {f.type === "select" ? (
              <select
                value={draft[f.key] as number}
                onChange={(e) => setDraft({ ...draft, [f.key]: +e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === "toggle" ? (
              <button
                onClick={() => setDraft({ ...draft, [f.key]: !draft[f.key] })}
                className={`px-3 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors ${
                  draft[f.key] ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {draft[f.key] ? "Si" : "No"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={draft[f.key] as number}
                  onChange={(e) => setDraft({ ...draft, [f.key]: +e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {f.suffix && <span className="text-xs text-gray-400 shrink-0">{f.suffix}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Schedule Editor Section ──────────────────────────────────────────────────

function ScheduleSection({
  schedules,
  courts,
}: {
  schedules: Schedule[];
  courts: Court[];
}) {
  const [selectedId, setSelectedId] = useState(schedules.find((s) => s.isActive)?.id ?? schedules[0]?.id ?? "");
  const schedule = schedules.find((s) => s.id === selectedId);
  const sv = schedule ? getCurrentScheduleVersion(schedule) : null;

  if (!schedule || !sv) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        No hay horarios configurados. Crea uno para empezar.
      </div>
    );
  }

  const assignedCourts = courts.filter((c) => sv.courtIds.includes(c.id));
  const unassignedCourts = courts.filter((c) => c.isActive && !sv.courtIds.includes(c.id));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-blue-600" />
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer pr-6 text-sm"
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isActive ? "(activo)" : ""}
              </option>
            ))}
          </select>
          {schedule.isActive ? (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Activo</span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Inactivo</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Turno: {sv.slotDurationMinutes} min</span>
        </div>
      </div>

      {/* Assigned courts */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 shrink-0">Canchas:</span>
          {assignedCourts.map((c) => {
            const v = getCurrentVersion(c);
            return (
              <span key={c.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {getSportEmoji(v.sport)} {v.name}
              </span>
            );
          })}
          {unassignedCourts.length > 0 && (
            <span className="text-[10px] text-gray-400">
              +{unassignedCourts.length} sin asignar
            </span>
          )}
        </div>
      </div>

      {/* Weekly schedule grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-2.5 font-medium text-gray-500 w-20">Dia</th>
              <th className="text-left px-5 py-2.5 font-medium text-gray-500">Rangos horarios</th>
              <th className="text-center px-5 py-2.5 font-medium text-gray-500 w-24">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sv.days.map((day) => (
              <tr key={day.dayOfWeek} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <span className="font-semibold text-gray-900">{DAY_LABELS[day.dayOfWeek]}</span>
                </td>
                <td className="px-5 py-2">
                  {day.isClosed ? (
                    <span className="text-xs text-gray-400">Cerrado</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {day.timeRanges.map((range) => {
                        const pc = priceColor(range.pricePerSlot);
                        return (
                          <div
                            key={range.id}
                            className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${pc.bg} ${pc.text} ${pc.border}`}
                          >
                            <span>{range.startTime}–{range.endTime}</span>
                            <span className="font-bold">{range.pricePerSlot} cr</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    day.isClosed ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {day.isClosed ? "Cerrado" : "Abierto"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price legend */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-gray-400 font-medium">Precios:</span>
        {Array.from(new Set(sv.days.flatMap((d) => d.timeRanges.map((r) => r.pricePerSlot)))).sort((a, b) => a - b).map((p) => {
          const pc = priceColor(p);
          return (
            <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>
              {p} cr
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Special Days Section ─────────────────────────────────────────────────────

function SpecialDaysSection({
  specialDays,
  schedules,
}: {
  specialDays: SpecialDay[];
  schedules: Schedule[];
}) {
  const sorted = [...specialDays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Dias especiales</h3>
          <span className="text-xs text-gray-400">({sorted.length})</span>
        </div>
        <button className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          No hay dias especiales configurados
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((sd) => {
            const override = sd.scheduleOverrideId ? schedules.find((s) => s.id === sd.scheduleOverrideId) : null;
            return (
              <div key={sd.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    sd.isClosed ? "bg-red-50" : "bg-amber-50"
                  }`}>
                    {sd.isClosed ? (
                      <Ban className="w-4 h-4 text-red-400" />
                    ) : (
                      <CalendarDays className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sd.label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sd.date + "T00:00:00").toLocaleDateString("es-PE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sd.isClosed ? (
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Cerrado</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {override?.name ?? "Horario especial"}
                    </span>
                  )}
                  <button className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Availability Preview Section ─────────────────────────────────────────────

function PreviewSection({ courts }: { courts: Court[] }) {
  const today = new Date(2026, 2, 27);
  const [previewDate, setPreviewDate] = useState(today);
  const [previewCourt, setPreviewCourt] = useState(courts.find((c) => c.isActive)?.id ?? "");

  const slots = useMemo(() => {
    if (!previewCourt) return [];
    return generateSlots(previewDate, previewCourt);
  }, [previewDate, previewCourt]);

  const activeCourts = courts.filter((c) => c.isActive);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-gray-900">Vista previa de disponibilidad</h3>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={previewCourt}
            onChange={(e) => setPreviewCourt(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activeCourts.map((c) => {
              const v = getCurrentVersion(c);
              return <option key={c.id} value={c.id}>{getSportEmoji(v.sport)} {v.name}</option>;
            })}
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreviewDate(addDays(previewDate, -1))}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-500"
            >
              ‹
            </button>
            <DatePicker
              value={previewDate}
              onChange={(d) => d && setPreviewDate(d)}
              placeholder="Fecha"
            />
            <button
              onClick={() => setPreviewDate(addDays(previewDate, 1))}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-500"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Slots grid */}
      <div className="p-5">
        {slots.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            <Ban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            Sin disponibilidad para esta fecha
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {slots.map((slot) => {
              const isAvailable = slot.available;
              const pc = priceColor(slot.creditsCost);
              return (
                <div
                  key={slot.startTime}
                  className={`rounded-lg border p-2 text-center transition-colors ${
                    isAvailable
                      ? `${pc.bg} ${pc.border} hover:shadow-sm`
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <p className={`text-xs font-bold ${isAvailable ? pc.text : "text-gray-400"}`}>
                    {slot.startTime}
                  </p>
                  <p className={`text-[10px] ${isAvailable ? "text-gray-500" : "text-gray-400"}`}>
                    {slot.durationMinutes} min
                  </p>
                  {isAvailable && (
                    <p className={`text-[10px] font-bold mt-0.5 ${pc.text}`}>{slot.creditsCost} cr</p>
                  )}
                  {!isAvailable && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {slot.creditsCost > 0 ? "Ocupado" : "—"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {slots.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium">Leyenda:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
            <span className="text-[10px] text-gray-500">Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
            <span className="text-[10px] text-gray-500">Ocupado / Bloqueado</span>
          </div>
          {PRICE_COLORS.filter((_, i) => i < 4).map((pc, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${pc.bg} border ${pc.border}`} />
              <span className="text-[10px] text-gray-500">
                {i === 0 ? "Bajo" : i === 1 ? "Normal" : i === 2 ? "Alto" : "Premium"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Availability Tab ────────────────────────────────────────────────────

export default function AvailabilityTab() {
  const td = useTenantData();
  const [config, setConfig] = useState(td.availabilityConfig);

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Modulo de disponibilidad</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Configura las reglas de horarios, duracion de turnos y precios. Los cambios se aplican inmediatamente a la vista de reservas de los socios.
          </p>
        </div>
      </div>

      {/* Config global */}
      <ConfigSection config={config} onChange={setConfig} />

      {/* Schedule editor */}
      <ScheduleSection schedules={td.schedules} courts={td.courts} />

      {/* Special days */}
      <SpecialDaysSection specialDays={td.specialDays} schedules={td.schedules} />

      {/* Preview */}
      <PreviewSection courts={td.courts} />
    </div>
  );
}
