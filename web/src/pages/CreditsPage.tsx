import { useState } from "react";
import { Link } from "react-router-dom";
import { useTenantData } from "@/hooks/useTenantData";
import { api } from "@/lib/api";
import { CheckCircle, Clock, Plus, Search, X, ScanLine } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

// ── Local state types ────────────────────────────────────────────────────────

interface SaleRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  pricePaid: number; // soles
  method: string;
  note: string;
  createdAt: string;
}

const initialSales: SaleRecord[] = [
  { id: "s1", memberId: "m1", memberName: "Pedro Ramirez", amount: 50, pricePaid: 150, method: "Yape", note: "Paquete mensual", createdAt: "2026-03-01T10:00:00" },
  { id: "s2", memberId: "m2", memberName: "Lucia Fernandez", amount: 50, pricePaid: 150, method: "Transferencia", note: "Paquete mensual", createdAt: "2026-03-01T10:30:00" },
  { id: "s3", memberId: "m3", memberName: "Jorge Castillo", amount: 30, pricePaid: 90, method: "Efectivo", note: "Paquete basico", createdAt: "2026-03-01T11:00:00" },
  { id: "s4", memberId: "m1", memberName: "Pedro Ramirez", amount: 10, pricePaid: 35, method: "Yape", note: "Recarga extra", createdAt: "2026-03-15T14:00:00" },
  { id: "s5", memberId: "m5", memberName: "Diego Herrera", amount: 50, pricePaid: 150, method: "Plin", note: "Paquete mensual", createdAt: "2026-03-02T09:00:00" },
];

const paymentMethods = ["Efectivo", "Yape", "Plin", "Transferencia", "POS"];

export default function CreditsPage() {
  const td = useTenantData();

  // ── Sales state ────────────────────────────────────────────────────────────
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleSearch, setSaleSearch] = useState("");
  const [saleForm, setSaleForm] = useState({
    memberId: "",
    amount: 10,
    pricePaid: 0,
    method: "Yape",
    note: "",
  });
  const [scanning, setScanning] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);

  // ── QR Scan simulation ─────────────────────────────────────────────────────
  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      const active = td.members.filter((m) => m.user.status === "active");
      const picked = active[Math.floor(Math.random() * active.length)];
      setSaleForm({ ...saleForm, memberId: picked.id });
      setScanning(false);
    }, 1500);
  }

  // ── Sales handlers ─────────────────────────────────────────────────────────
  async function handleSale() {
    const member = td.members.find((m) => m.id === saleForm.memberId);
    if (!member) return;

    await api.post(`/v1/members/${member.id}/credit-sales`, {
      amount: saleForm.amount,
      pricePaid: saleForm.pricePaid,
      method: saleForm.method,
      note: saleForm.note,
    });

    const newSale: SaleRecord = {
      id: `s${Date.now()}`,
      memberId: member.id,
      memberName: member.user.name,
      amount: saleForm.amount,
      pricePaid: saleForm.pricePaid,
      method: saleForm.method,
      note: saleForm.note,
      createdAt: new Date().toISOString(),
    };
    setSales([newSale, ...sales]);
    td.refetch();
    setShowSaleForm(false);
    setSaleForm({ memberId: "", amount: 10, pricePaid: 0, method: "Yape", note: "" });
    setSaleSuccess(`${newSale.amount} creditos cargados a ${member.user.name}`);
    setTimeout(() => setSaleSuccess(null), 4000);
  }

  const filteredSales = sales.filter(
    (s) =>
      s.memberName.toLowerCase().includes(saleSearch.toLowerCase()) ||
      s.method.toLowerCase().includes(saleSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Creditos</h1>
        <Dialog.Root open={showSaleForm} onOpenChange={setShowSaleForm}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              <Plus className="w-4 h-4" />
              Vender creditos
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-bold text-gray-900">
                  Nueva venta de creditos
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Registrar una nueva venta de creditos a un miembro
              </Dialog.Description>

              {/* QR Scan area */}
              {scanning ? (
                <div className="bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-xl flex items-center justify-center relative">
                    <div className="absolute inset-x-4 h-0.5 bg-blue-400 animate-pulse" style={{ top: "50%" }} />
                    <ScanLine className="w-12 h-12 text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-sm text-blue-300">Escaneando QR del socio...</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={simulateScan}
                  className="w-full flex items-center justify-center gap-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
                >
                  <ScanLine className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Escanear QR del socio</p>
                    <p className="text-xs text-gray-400">O selecciona manualmente abajo</p>
                  </div>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={saleForm.memberId}
                    onChange={(e) => setSaleForm({ ...saleForm, memberId: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {td.members.filter((m) => m.user.status === "active").map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.user.name} ({m.creditBalance} cr)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creditos</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm({ ...saleForm, amount: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={saleForm.pricePaid}
                    onChange={(e) => setSaleForm({ ...saleForm, pricePaid: +e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metodo de pago</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={saleForm.method}
                    onChange={(e) => setSaleForm({ ...saleForm, method: e.target.value })}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paquete mensual..."
                    value={saleForm.note}
                    onChange={(e) => setSaleForm({ ...saleForm, note: e.target.value })}
                  />
                </div>
              </div>

              {saleForm.memberId && saleForm.amount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  Se cargaran <strong>{saleForm.amount} creditos</strong> a{" "}
                  <strong>{td.members.find((m) => m.id === saleForm.memberId)?.user.name}</strong>
                  {saleForm.pricePaid > 0 && (
                    <> por <strong>S/ {saleForm.pricePaid.toFixed(2)}</strong> via {saleForm.method}</>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Dialog.Close asChild>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleSale}
                  disabled={!saleForm.memberId || saleForm.amount <= 0}
                  className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  Confirmar venta
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Info: pricing now in Schedules */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700">
          Los precios por horario se configuran en{" "}
          <Link to="/schedules" className="font-medium underline hover:text-blue-900">
            Horarios
          </Link>
        </p>
      </div>

      {/* Sale success toast */}
      {saleSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in-0 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{saleSuccess}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar por miembro o metodo..."
          value={saleSearch}
          onChange={(e) => setSaleSearch(e.target.value)}
        />
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Miembro</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Creditos</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Monto (S/)</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Metodo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Descripcion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{s.memberName}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                    +{s.amount} cr
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900">
                    {s.pricePaid > 0 ? `S/ ${s.pricePaid.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {s.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">
                    {s.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No se encontraron ventas</p>
        )}
      </div>
    </div>
  );
}
