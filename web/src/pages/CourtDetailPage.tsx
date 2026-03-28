import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTenantData } from "@/hooks/useTenantData";
import {
  getCurrentVersion,
  getSportLabel,
  getSportEmoji,
  getCourtTypeLabel,
} from "@/lib/domain";
import type { CourtSport } from "@/lib/domain";
import type { Court, CourtVersion, CourtSchedule } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Ban,
  Clock,
  History,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import PadelIcon from "@/components/PadelIcon";
import DatePicker from "@/components/DatePicker";
import { format } from "date-fns";

type CourtFormData = {
  name: string;
  sport: CourtSport;
  type: Court["versions"][0]["type"];
  surface: string;
  capacity: number;
  priceMultiplier: number;
  sedeId: string;
  reason: string;
};

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const td = useTenantData();

  const courts = td.courts;
  const schedules = td.courtSchedules;
  const blocks = td.courtBlocks;
  const [editModal, setEditModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [forceBlock, setForceBlock] = useState(false);

  const maybeCourt = courts.find((c) => c.id === id);
  const court: Court | undefined = maybeCourt;
  const v = court ? getCurrentVersion(court) : { name: "", sport: "padel", type: "indoor", surface: "", capacity: 4, priceMultiplier: 1 };
  const courtSchedules = court ? schedules.filter((s) => s.courtId === court.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek) : [];
  const courtBlocks = court ? blocks.filter((b) => b.courtId === court.id) : [];
  const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

  // ── Edit form (must be declared before any early return) ──────────────────
  const [form, setForm] = useState<CourtFormData>({
    name: v.name,
    sport: v.sport as CourtSport,
    type: v.type,
    surface: v.surface,
    capacity: v.capacity,
    priceMultiplier: v.priceMultiplier,
    sedeId: court?.sedeId ?? "",
    reason: "",
  });

  // ── Block conflict detection (hook — must be before early return) ─────────
  const blockConflicts = useMemo(() => {
    if (!blockForm.date || !court) return [];
    return td.bookings.filter((b) => {
      if (b.courtId !== court.id || b.status !== "confirmed") return false;
      const bookingDate = b.startTime.split("T")[0];
      if (bookingDate !== blockForm.date) return false;
      if (!blockForm.startTime && !blockForm.endTime) return true;
      const bStart = b.startTime.split("T")[1]?.substring(0, 5) ?? "";
      const bEnd = b.endTime.split("T")[1]?.substring(0, 5) ?? "";
      if (blockForm.startTime && blockForm.endTime) return bStart < blockForm.endTime && bEnd > blockForm.startTime;
      return false;
    });
  }, [blockForm.date, blockForm.startTime, blockForm.endTime, court, td.bookings]);

  if (!court) {
    return (
      <div className="space-y-4">
        <Link to="/courts" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver a canchas
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Cancha no encontrada</p>
        </div>
      </div>
    );
  }

  function openEdit() {
    setForm({
      name: v.name, sport: v.sport as CourtSport, type: v.type, surface: v.surface,
      capacity: v.capacity, priceMultiplier: v.priceMultiplier,
      sedeId: court.sedeId ?? "", reason: "",
    });
    setEditModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.reason.trim()) return;
    await api.put(`/v1/courts/${court.id}`, {
      name: form.name,
      sport: form.sport,
      type: form.type,
      surface: form.surface,
      capacity: form.capacity,
      priceMultiplier: form.priceMultiplier,
      sedeId: form.sedeId || null,
      reason: form.reason,
    });
    td.refetch();
    setEditModal(false);
  }

  async function toggleActive() {
    await api.put(`/v1/courts/${court.id}`, { isActive: !court.isActive });
    td.refetch();
    setDeactivateModal(false);
  }

  // ── Version diff ─────────────────────────────────────────────────────────
  function getChanges(prev: CourtVersion, curr: CourtVersion): string[] {
    const changes: string[] = [];
    if (prev.name !== curr.name) changes.push(`Nombre: ${prev.name} → ${curr.name}`);
    if (prev.sport !== curr.sport) changes.push(`Deporte: ${getSportLabel(prev.sport)} → ${getSportLabel(curr.sport)}`);
    if (prev.type !== curr.type) changes.push(`Tipo: ${getCourtTypeLabel(prev.type)} → ${getCourtTypeLabel(curr.type)}`);
    if (prev.surface !== curr.surface) changes.push(`Superficie: ${prev.surface} → ${curr.surface}`);
    if (prev.capacity !== curr.capacity) changes.push(`Capacidad: ${prev.capacity} → ${curr.capacity}`);
    if (prev.priceMultiplier !== curr.priceMultiplier) changes.push(`Multiplicador: ×${prev.priceMultiplier} → ×${curr.priceMultiplier}`);
    return changes;
  }

  // ── Schedule editing ─────────────────────────────────────────────────────
  async function updateSchedule(sid: string, field: keyof CourtSchedule, value: string | boolean) {
    const schedule = schedules.find((s) => s.id === sid);
    if (!schedule) return;
    await api.post(`/v1/courts/${court.id}/schedule`, { ...schedule, [field]: value });
    td.refetch();
  }

  const hasConflicts = blockConflicts.length > 0;

  async function addBlock() {
    if (!blockForm.date) return;
    if (hasConflicts && !forceBlock) return;
    await api.post(`/v1/courts/${court.id}/blocks`, {
      date: blockForm.date,
      startTime: blockForm.startTime || null,
      endTime: blockForm.endTime || null,
      reason: blockForm.reason,
    });
    td.refetch();
    setBlockModal(false);
    setForceBlock(false);
    setBlockForm({ date: "", startTime: "", endTime: "", reason: "" });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link to="/courts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Canchas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${court.isActive ? "bg-blue-50" : "bg-red-50"}`}>
            <PadelIcon className={`w-6 h-6 ${court.isActive ? "text-blue-500" : "text-red-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">{v.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${court.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                {court.isActive ? "Activa" : "Inactiva"}
              </span>
              {v.priceMultiplier !== 1 && (
                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">×{v.priceMultiplier}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {getSportEmoji(v.sport)} {getSportLabel(v.sport)} · {getCourtTypeLabel(v.type)}
              {td.hasMultipleSedes && court.sedeId && (
                <> · <MapPin className="w-3 h-3 inline text-blue-500" /> {td.sedes.find((s) => s.id === court.sedeId)?.name}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={openEdit} className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={() => court.isActive ? setDeactivateModal(true) : toggleActive()}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${court.isActive ? "text-red-600 bg-white border-red-200 hover:bg-red-50" : "text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-50"}`}
          >
            {court.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Superficie</p>
            <p className="text-sm text-gray-800">{v.surface}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Capacidad</p>
            <p className="text-sm text-gray-800">{v.capacity} jugadores</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Versión</p>
            <p className="text-sm text-gray-800">v{v.version}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Multiplicador</p>
            <p className="text-sm text-gray-800">×{v.priceMultiplier}</p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Horarios</h2>
        </div>
        {courtSchedules.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">Sin horarios configurados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 w-24">Dia</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Apertura</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Cierre</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500 w-28">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courtSchedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2 font-medium text-gray-900">{dayLabels[s.dayOfWeek]}</td>
                    <td className="px-5 py-2">
                      <input type="time" value={s.openTime ?? ""} disabled={s.isClosed}
                        onChange={(e) => updateSchedule(s.id, "openTime", e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input type="time" value={s.closeTime ?? ""} disabled={s.isClosed}
                        onChange={(e) => updateSchedule(s.id, "closeTime", e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-2 text-center">
                      <button onClick={() => updateSchedule(s.id, "isClosed", !s.isClosed)}
                        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${s.isClosed ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                      >
                        {s.isClosed ? "Cerrado" : "Abierto"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blocks */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-900">Bloqueos</h2>
          </div>
          <button onClick={() => { setForceBlock(false); setBlockModal(true); }}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Bloquear horario
          </button>
        </div>
        {courtBlocks.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">Sin bloqueos</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {courtBlocks.map((bl) => (
              <div key={bl.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(bl.date + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-xs text-gray-500">
                    {bl.startTime && bl.endTime ? `${bl.startTime} – ${bl.endTime}` : "Todo el dia"}
                  </span>
                  {bl.reason && <span className="text-xs text-gray-400">· {bl.reason}</span>}
                </div>
                <button onClick={async () => { await api.delete(`/v1/courts/${court.id}/blocks/${bl.id}`); td.refetch(); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version history */}
      {court.versions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">Historial de versiones</span>
              <span className="text-xs text-gray-400">{court.versions.length} versiones</span>
            </div>
            <span className="text-xs text-gray-400">{historyOpen ? "Ocultar" : "Mostrar"}</span>
          </button>
          {historyOpen && (
            <div className="px-5 pb-5 space-y-3">
              {[...court.versions].reverse().map((ver, idx) => {
                const prevVer = court.versions.find((v2) => v2.version === ver.version - 1);
                const changes = prevVer ? getChanges(prevVer, ver) : [];
                return (
                  <div key={ver.id} className="relative pl-4 border-l-2 border-gray-200">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">v{ver.version}</span>
                      {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Actual</span>}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(ver.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}<span className="text-gray-500">{ver.changedBy}</span>
                    </p>
                    {ver.reason && <p className="text-[11px] text-blue-600 mt-0.5 italic">"{ver.reason}"</p>}
                    {changes.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {changes.map((c, i) => <li key={i} className="text-[11px] text-gray-500">{c}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <Dialog.Root open={editModal} onOpenChange={setEditModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">Editar cancha</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Editar los datos de la cancha</Dialog.Description>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="covered">Techado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Superficie</label>
                  <input type="text" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicador de precio</label>
                  <input type="number" min={0.1} step={0.1} value={form.priceMultiplier} onChange={(e) => setForm({ ...form, priceMultiplier: +e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del cambio *</label>
                <input type="text" placeholder="Ej: Cambio de superficie" value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              </Dialog.Close>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
                Guardar cambios
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Block Modal ── */}
      <Dialog.Root open={blockModal} onOpenChange={setBlockModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">Bloquear horario</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Bloquear un horario en esta cancha</Dialog.Description>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <DatePicker
                  value={blockForm.date ? new Date(blockForm.date + "T00:00:00") : undefined}
                  onChange={(d) => setBlockForm({ ...blockForm, date: d ? format(d, "yyyy-MM-dd") : "" })}
                  placeholder="Seleccionar fecha" className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde (opcional)</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={blockForm.startTime} onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (opcional)</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={blockForm.endTime} onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input type="text" placeholder="Ej: Mantenimiento" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
              </div>
              {hasConflicts && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Hay {blockConflicts.length} reserva(s) confirmada(s) en ese horario.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={forceBlock} onChange={(e) => setForceBlock(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-xs text-amber-700 font-medium">Bloquear de todas formas</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              </Dialog.Close>
              <button onClick={addBlock} disabled={!blockForm.date || (hasConflicts && !forceBlock)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40">
                Bloquear
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Deactivate Modal ── */}
      {deactivateModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDeactivateModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Desactivar {v.name}</h2>
            <p className="text-sm text-gray-500">La cancha dejará de aparecer para nuevas reservas. Las reservas existentes no se cancelan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeactivateModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={toggleActive}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">Desactivar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
