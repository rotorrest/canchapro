import { useState } from "react";
import type { Member } from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";
import { ShieldCheck, Clock, Percent, Search, Info } from "lucide-react";

export default function CancellationPolicyPage() {
  const td = useTenantData();
  // ── Policy state ──────────────────────────────────────────────────────────
  const [windowHours, setWindowHours] = useState(24);
  const [refundInside, setRefundInside] = useState(100);
  const [refundOutside, setRefundOutside] = useState(0);
  const [allowOutsideWindow, setAllowOutsideWindow] = useState(true);
  const [saved, setSaved] = useState(false);

  // ── Exemptions state ──────────────────────────────────────────────────────
  const [members] = useState<Member[]>(td.members);
  const [exemptIds, setExemptIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const activeMembers = members.filter((m) => m.user.status === "active");
  const filtered = activeMembers.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );
  const exemptCount = activeMembers.filter((m) => exemptIds.has(m.id)).length;

  function handleSavePolicy() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleExempt(id: string) {
    setExemptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Politica de cancelacion
      </h1>

      {/* ── Section 1: Policy Configuration ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-blue-800" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Configuracion de politica
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Window hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                Ventana de cancelacion (horas antes)
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={windowHours}
              onChange={(e) =>
                setWindowHours(Math.max(0, Number(e.target.value)))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Refund inside window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-gray-400" />
                Reembolso dentro de ventana (%)
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={refundInside}
              onChange={(e) =>
                setRefundInside(clamp(Number(e.target.value), 0, 100))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Refund outside window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-gray-400" />
                Reembolso fuera de ventana (%)
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={refundOutside}
              onChange={(e) =>
                setRefundOutside(clamp(Number(e.target.value), 0, 100))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Allow outside window */}
          <div className="flex items-center gap-3 self-end pb-1">
            <button
              type="button"
              role="switch"
              aria-checked={allowOutsideWindow}
              onClick={() => setAllowOutsideWindow(!allowOutsideWindow)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                allowOutsideWindow ? "bg-blue-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  allowOutsideWindow ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Permitir cancelacion fuera de ventana
            </span>
          </div>
        </div>

        {/* Info box */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Los socios pueden cancelar hasta{" "}
            <strong>{windowHours} horas</strong> antes y recibir{" "}
            <strong>{refundInside}%</strong> de sus creditos. Fuera de ventana
            reciben <strong>{refundOutside}%</strong>.
          </p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePolicy}
            className="bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
          >
            Guardar politica
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium animate-pulse">
              Politica guardada correctamente
            </span>
          )}
        </div>
      </div>

      {/* ── Section 2: Exemptions per member ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Exenciones por socio
          </h2>
        </div>

        {/* Search + count */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar socio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {exemptCount} socios exentos de {activeMembers.length} activos
          </span>
        </div>

        {/* Info box */}
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Los socios exentos pueden cancelar en cualquier momento y recibir el
            100% de sus creditos, sin importar la politica general.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 font-semibold text-gray-600">Nombre</th>
                <th className="pb-3 font-semibold text-gray-600">Email</th>
                <th className="pb-3 font-semibold text-gray-600 text-right">
                  Saldo
                </th>
                <th className="pb-3 font-semibold text-gray-600 text-center">
                  Exento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-900">
                    {m.user.name}
                  </td>
                  <td className="py-3 text-gray-600">{m.user.email}</td>
                  <td className="py-3 text-gray-900 text-right tabular-nums">
                    {m.creditBalance}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={exemptIds.has(m.id)}
                      onClick={() => toggleExempt(m.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        exemptIds.has(m.id) ? "bg-amber-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                          exemptIds.has(m.id)
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    No se encontraron socios activos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
