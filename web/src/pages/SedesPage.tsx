import { useState } from "react";
import { MapPin, Plus, Trash2, Building2, AlertCircle, X } from "lucide-react";
import { useTenantData } from "@/hooks/useTenantData";
import type { Sede } from "@/lib/mock-data";

interface SedeForm {
  name: string;
  address: string;
  city: string;
}

const EMPTY_FORM: SedeForm = { name: "", address: "", city: "" };

export default function SedesPage() {
  const td = useTenantData();

  const [sedes, setSedes] = useState<Sede[]>(td.sedes);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<SedeForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<SedeForm>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Count courts per sede
  const courtsBySede = Object.fromEntries(
    sedes.map((s) => [s.id, td.courts.filter((c) => c.sedeId === s.id).length])
  );

  function validate(): boolean {
    const e: Partial<SedeForm> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.address.trim()) e.address = "Requerido";
    if (!form.city.trim()) e.city = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    const newSede: Sede = {
      id: `s-${Date.now()}`,
      tenantId: td.tenantId ?? "t1",
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
    };
    setSedes((prev) => [...prev, newSede]);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  }

  function handleDelete(id: string) {
    setSedes((prev) => prev.filter((s) => s.id !== id));
    setDeleteId(null);
  }

  function handleCloseModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  const sedeToDelete = sedes.find((s) => s.id === deleteId);
  const sedeToDeleteCourts = deleteId ? (courtsBySede[deleteId] ?? 0) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sedes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las ubicaciones fisicas de tu club.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva sede
        </button>
      </div>

      {/* Sede list */}
      {sedes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Sin sedes registradas</p>
          <p className="text-xs text-gray-400 mt-1">Agrega la primera sede de tu club.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {sedes.map((sede) => {
            const courts = courtsBySede[sede.id] ?? 0;
            return (
              <div key={sede.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{sede.name}</p>
                  <p className="text-xs text-gray-500 truncate">{sede.address} · {sede.city}</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {courts} {courts === 1 ? "cancha" : "canchas"}
                </div>
                <button
                  onClick={() => setDeleteId(sede.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Eliminar sede"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nueva sede</h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de la sede
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sede Norte"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Direccion
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Primavera 123, Miraflores"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lima"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCloseModal}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Agregar sede
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && sedeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Eliminar sede</h2>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Eliminar <span className="font-medium text-gray-800">"{sedeToDelete.name}"</span>?
                  {sedeToDeleteCourts > 0 && (
                    <span className="block mt-1 text-amber-600">
                      Esta sede tiene {sedeToDeleteCourts} {sedeToDeleteCourts === 1 ? "cancha asignada" : "canchas asignadas"}.
                      Las canchas quedarán sin sede.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
