import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStatusColor, getStatusLabel } from "@/lib/domain";
import { useTenantData } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export default function MembersPage() {
  const navigate = useNavigate();
  const td = useTenantData();
  const members = td.members;
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", allocation: 50 });

  const filtered = members.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  async function setStatus(id: string, status: "active" | "suspended" | "inactive") {
    await api.put(`/v1/members/${id}`, { status });
    td.refetch();
  }

  async function handleAdd() {
    await api.post("/v1/members", {
      name: form.name,
      email: form.email,
      creditAllocationMonthly: form.allocation,
    });
    td.refetch();
    setShowForm(false);
    setForm({ name: "", email: "", allocation: 50 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
        <Dialog.Root open={showForm} onOpenChange={setShowForm}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              <Plus className="w-4 h-4" />
              Nuevo miembro
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-bold text-gray-900">
                  Nuevo miembro
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Agregar un nuevo miembro al club
              </Dialog.Description>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan Perez"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creditos / mes</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.allocation}
                    onChange={(e) => setForm({ ...form, allocation: +e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Dialog.Close asChild>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleAdd}
                  disabled={!form.name || !form.email}
                  className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar miembro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Saldo</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Asignación</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {m.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900 hover:text-blue-700">{m.user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{m.user.email}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {m.creditBalance} cr
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {m.creditAllocationMonthly} cr/mes
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                        m.user.status
                      )}`}
                    >
                      {getStatusLabel(m.user.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-1 justify-end items-center">
                      {m.user.status === "active" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatus(m.id, "suspended"); }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Suspender
                        </button>
                      )}
                      {m.user.status === "suspended" && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setStatus(m.id, "active"); }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Activar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setStatus(m.id, "inactive"); }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Desactivar
                          </button>
                        </>
                      )}
                      {m.user.status === "inactive" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatus(m.id, "active"); }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Reactivar
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No se encontraron miembros</p>
        )}
      </div>
    </div>
  );
}
