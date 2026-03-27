import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  getCourtTypeLabel,
  getSportLabel,
  getSportEmoji,
  getCurrentVersion,
  getActiveScheduleForCourt,
} from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";
import type { Court, CourtVersion, CourtBlock, Booking, CourtSport } from "@/lib/mock-data";
import { Ban, ChevronRight, MapPin, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import PadelIcon from "@/components/PadelIcon";
import DatePicker from "@/components/DatePicker";
import { format } from "date-fns";
import { useSedeStore } from "@/store/sedeStore";
import AvailabilityTab from "@/components/availability/AvailabilityTab";

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

const EMPTY_FORM: CourtFormData = {
  name: "",
  sport: "padel",
  type: "indoor",
  surface: "Césped artificial",
  capacity: 4,
  priceMultiplier: 1,
  sedeId: "",
  reason: "",
};

export default function CourtsPage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const [courts, setCourts] = useState<Court[]>(td.courts);
  const { selectedSede } = useSedeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [form, setForm] = useState<CourtFormData>(EMPTY_FORM);
  const [tab, setTab] = useState<"courts" | "availability" | "blocks">("courts");
  const [blocks, setBlocks] = useState<CourtBlock[]>(td.courtBlocks);
  const [blockModal, setBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ courtId: "", date: "", startTime: "", endTime: "", reason: "" });
  const [deactivateModal, setDeactivateModal] = useState<{ courtId: string; courtName: string } | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  // ── Open modal for new court ───────────────────────────────────────────────
  function openAdd() {
    setEditingCourtId(null);
    setForm({ ...EMPTY_FORM, sedeId: td.sedes.length > 0 ? td.sedes[0].id : "" });
    setModalOpen(true);
  }

  // ── Save handler ───────────────────────────────────────────────────────────
  function handleSave() {
    if (!form.name.trim()) return;
    const userName = user?.name ?? "Sistema";

    if (editingCourtId) {
      if (!form.reason.trim()) return; // reason required on edit
      setCourts(
        courts.map((c) => {
          if (c.id !== editingCourtId) return c;
          const prev = getCurrentVersion(c);
          const newVersion: CourtVersion = {
            id: `cv${Date.now()}`,
            courtId: c.id,
            version: prev.version + 1,
            name: form.name,
            sport: form.sport,
            type: form.type,
            surface: form.surface,
            capacity: form.capacity,
            priceMultiplier: form.priceMultiplier,
            createdAt: new Date().toISOString(),
            changedBy: userName,
            reason: form.reason,
          };
          return { ...c, versions: [...c.versions, newVersion] };
        })
      );
    } else {
      const id = `c${Date.now()}`;
      const newCourt: Court = {
        id,
        tenantId: td.tenantId ?? "t1",
        sedeId: form.sedeId || (td.sedes.length === 1 ? td.sedes[0].id : null),
        isActive: true,
        versions: [
          {
            id: `cv${Date.now()}`,
            courtId: id,
            version: 1,
            name: form.name,
            sport: form.sport,
            type: form.type,
            surface: form.surface,
            capacity: form.capacity,
            priceMultiplier: form.priceMultiplier,
            createdAt: new Date().toISOString(),
            changedBy: userName,
            reason: "Creacion inicial",
          },
        ],
      };
      setCourts([...courts, newCourt]);
    }

    setModalOpen(false);
    setForm(EMPTY_FORM);
    setEditingCourtId(null);
  }

  function confirmDeactivate() {
    if (!deactivateModal) return;
    setCourts(courts.map((c) => (c.id === deactivateModal.courtId ? { ...c, isActive: false } : c)));
    setDeactivateModal(null);
    setDeactivateReason("");
  }

  // ── Conflict detection ─────────────────────────────────────────────────────
  const blockConflicts = useMemo((): Booking[] => {
    if (!blockForm.courtId || !blockForm.date) return [];

    return td.bookings.filter((b) => {
      if (b.courtId !== blockForm.courtId) return false;
      if (b.status !== "confirmed") return false;

      const bookingDate = b.startTime.split("T")[0];
      if (bookingDate !== blockForm.date) return false;

      // Full-day block → all bookings conflict
      if (!blockForm.startTime && !blockForm.endTime) return true;

      // Partial block → check overlap
      const bStart = b.startTime.split("T")[1]?.substring(0, 5) ?? "";
      const bEnd = b.endTime.split("T")[1]?.substring(0, 5) ?? "";
      const fStart = blockForm.startTime;
      const fEnd = blockForm.endTime;

      if (fStart && fEnd) {
        return bStart < fEnd && bEnd > fStart;
      }
      return false;
    });
  }, [blockForm.courtId, blockForm.date, blockForm.startTime, blockForm.endTime]);

  const hasConflicts = blockConflicts.length > 0;
  const [forceBlock, setForceBlock] = useState(false);

  function addBlock() {
    if (!blockForm.courtId || !blockForm.date) return;
    if (hasConflicts && !forceBlock) return;

    const newBlock: CourtBlock = {
      id: `cb${Date.now()}`,
      tenantId: td.tenantId ?? "t1",
      scope: "court",
      sedeId: selectedSede ?? null,
      courtId: blockForm.courtId,
      date: blockForm.date,
      startTime: blockForm.startTime || null,
      endTime: blockForm.endTime || null,
      reason: blockForm.reason,
    };
    setBlocks([...blocks, newBlock]);
    setBlockModal(false);
    setForceBlock(false);
    setBlockForm({ courtId: "", date: "", startTime: "", endTime: "", reason: "" });
  }

  function openBlockModal() {
    setForceBlock(false);
    setBlockModal(true);
  }

  function removeBlock(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Canchas</h1>
        <div className="flex gap-2">
          {tab === "blocks" && (
            <button
              onClick={openBlockModal}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Bloquear horario
            </button>
          )}
          {tab === "courts" && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva cancha
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "courts" as const, label: "Canchas" },
          { key: "availability" as const, label: "Disponibilidad" },
          { key: "blocks" as const, label: "Bloqueos" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active sede indicator */}
      {td.hasMultipleSedes && (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {selectedSede ? td.sedes.find((s) => s.id === selectedSede)?.name : "Todas las sedes"}
          </span>
        </div>
      )}

      {/* ═══ COURTS TAB ═══ */}
      {tab === "courts" && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {courts.filter((c) => !selectedSede || c.sedeId === selectedSede).map((court) => {
            const v = getCurrentVersion(court);
            const courtBlockCount = blocks.filter((b) => b.courtId === court.id).length;

            return (
              <Link
                key={court.id}
                to={`/courts/${court.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  !court.isActive ? "opacity-60" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  court.isActive ? "bg-blue-50" : "bg-red-50"
                }`}>
                  <PadelIcon className={`w-4 h-4 ${court.isActive ? "text-blue-500" : "text-red-400"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{v.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {getSportEmoji(v.sport)} {getSportLabel(v.sport)} · {getCourtTypeLabel(v.type)} · {v.surface}
                    {td.hasMultipleSedes && court.sedeId && (
                      <> · <span className="text-blue-500">{td.sedes.find((s) => s.id === court.sedeId)?.name}</span></>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const sch = getActiveScheduleForCourt(court.id);
                    return sch ? (
                      <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {sch.name}
                      </span>
                    ) : null;
                  })()}
                  {courtBlockCount > 0 && (
                    <span className="text-[10px] font-medium bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                      {courtBlockCount} bloqueo{courtBlockCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {v.priceMultiplier !== 1 && (
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      ×{v.priceMultiplier}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    court.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}>
                    {court.isActive ? "Activa" : "Inactiva"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            );
          })}
          {courts.filter((c) => !selectedSede || c.sedeId === selectedSede).length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No hay canchas registradas</p>
          )}
        </div>
      )}

      {/* ═══ AVAILABILITY TAB ═══ */}
      {tab === "availability" && <AvailabilityTab />}

      {/* ═══ BLOCKS TAB ═══ */}
      {tab === "blocks" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Cancha</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Horario</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Motivo</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blocks.map((b) => {
                  const court = courts.find((c) => c.id === b.courtId);
                  const courtName = court ? getCurrentVersion(court).name : b.courtId;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{courtName}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(b.date + "T00:00:00").toLocaleDateString("es-PE", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {b.startTime && b.endTime
                          ? `${b.startTime} – ${b.endTime}`
                          : "Todo el dia"}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{b.reason || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => removeBlock(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar bloqueo"
                          aria-label="Eliminar bloqueo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {blocks.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No hay bloqueos programados</p>
          )}
        </div>
      )}

      {/* ── Block Modal ──────────────────────────────────────────────────── */}
      <Dialog.Root open={blockModal} onOpenChange={setBlockModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Bloquear horario
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Bloquear un horario en una cancha</Dialog.Description>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancha</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={blockForm.courtId}
                  onChange={(e) => setBlockForm({ ...blockForm, courtId: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {courts.filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{getCurrentVersion(c).name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <DatePicker
                  value={blockForm.date ? new Date(blockForm.date + "T00:00:00") : undefined}
                  onChange={(d) => setBlockForm({ ...blockForm, date: d ? format(d, "yyyy-MM-dd") : "" })}
                  placeholder="Seleccionar fecha"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde (opcional)</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (opcional)</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">Deja las horas vacias para bloquear todo el dia.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mantenimiento, evento..."
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                />
              </div>

              {/* Conflict warnings */}
              {hasConflicts && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {blockConflicts.length === 1
                          ? "Hay 1 reserva confirmada en este horario"
                          : `Hay ${blockConflicts.length} reservas confirmadas en este horario`}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Bloquear implica que estas reservas deberan ser canceladas o reubicadas.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {blockConflicts.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs bg-white border border-amber-100 rounded-md px-2.5 py-1.5">
                        <div>
                          <span className="font-medium text-gray-900">{b.memberName}</span>
                          <span className="text-gray-400 mx-1.5">&middot;</span>
                          <span className="text-gray-500">
                            {new Date(b.startTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                            –
                            {new Date(b.endTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span className="text-amber-600 font-medium">{b.creditsDeducted} cr</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 pl-6 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceBlock}
                      onChange={(e) => setForceBlock(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-amber-700 font-medium">
                      Entiendo, bloquear de todas formas
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Dialog.Close asChild>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={addBlock}
                disabled={!blockForm.courtId || !blockForm.date || (hasConflicts && !forceBlock)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {hasConflicts ? "Bloquear igualmente" : "Bloquear"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Add / Edit Court Modal ───────────────────────────────────────── */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                {editingCourtId ? "Editar cancha" : "Nueva cancha"}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {editingCourtId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                Los cambios crean una <strong>nueva versión</strong>. Las reservas existentes mantienen la versión con la que fueron creadas.
              </div>
            )}

            <Dialog.Description className="sr-only">
              {editingCourtId
                ? "Editar los datos de la cancha. Se creará una nueva versión."
                : "Crear una nueva cancha."}
            </Dialog.Description>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Court 5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deporte</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.sport}
                  onChange={(e) =>
                    setForm({ ...form, sport: e.target.value as CourtSport })
                  }
                >
                  <option value="padel">🏓 Pádel</option>
                  <option value="tenis">🎾 Tenis</option>
                  <option value="futbol">⚽ Fútbol</option>
                  <option value="squash">🏸 Squash</option>
                  <option value="pickleball">🏓 Pickleball</option>
                  <option value="frontenis">🎾 Frontenis</option>
                  <option value="otro">🏟️ Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as CourtFormData["type"] })
                  }
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="covered">Techado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.sedeId}
                  onChange={(e) => setForm({ ...form, sedeId: e.target.value })}
                >
                  {td.sedes.length === 0 && <option value="">Sin sede</option>}
                  {td.sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Superficie</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.surface}
                  onChange={(e) => setForm({ ...form, surface: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Multiplicador de precio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.priceMultiplier}
                    onChange={(e) =>
                      setForm({ ...form, priceMultiplier: +e.target.value || 1 })
                    }
                  />
                  <span className="text-xs text-gray-400">
                    1 = precio base &middot; 1.5 = +50% &middot; 0.8 = -20%
                  </span>
                </div>
              </div>
              {editingCourtId && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del cambio <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Cambio de superficie por desgaste"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Dialog.Close className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || (!!editingCourtId && !form.reason.trim())}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {editingCourtId ? "Guardar nueva versión" : "Crear cancha"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Deactivate Court Modal ───────────────────────────────────────── */}
      <Dialog.Root open={!!deactivateModal} onOpenChange={(open) => { if (!open) { setDeactivateModal(null); setDeactivateReason(""); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Ban className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <Dialog.Title className="font-semibold text-gray-900">Desactivar cancha</Dialog.Title>
                  <p className="text-sm text-gray-500 mt-0.5">{deactivateModal?.courtName}</p>
                </div>
              </div>
              <Dialog.Close className="text-gray-400 hover:text-gray-600 mt-0.5">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Motivo de desactivación</label>
              <div className="grid grid-cols-2 gap-2">
                {["Mantenimiento", "Renovación", "Baja demanda", "Fuera de temporada", "Problema técnico", "Otro"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDeactivateReason(r)}
                    className={`text-sm px-3 py-2 rounded-lg border text-left transition-colors ${
                      deactivateReason === r
                        ? "border-red-400 bg-red-50 text-red-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Dialog.Close className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                type="button"
                disabled={!deactivateReason}
                onClick={confirmDeactivate}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Desactivar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
