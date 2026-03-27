import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { BILLING_PERIODS, TENANT_ADD_ONS, ADD_ONS_CATALOG, getTenantById } from "@/lib/mock-data";
import type { BillingPeriod } from "@/lib/mock-data";
import { Receipt, CheckCircle, Clock, FileText, AlertCircle, Send, Banknote, Package, ExternalLink } from "lucide-react";


function getStatusBadge(status: BillingPeriod["status"]) {
  const config = {
    pending: { label: "Pendiente", icon: Clock, style: "bg-amber-100 text-amber-700" },
    invoiced: { label: "Facturado", icon: FileText, style: "bg-blue-100 text-blue-700" },
    paid: { label: "Pagado", icon: CheckCircle, style: "bg-emerald-100 text-emerald-700" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${c.style}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

export default function BillingPage() {
  const { user, tenantId } = useAuthStore();
  const isPlatform = user?.role === "platform_admin";
  const [billingData, setBillingData] = useState<BillingPeriod[]>(BILLING_PERIODS);

  const periods = useMemo(() => {
    const all = [...billingData].sort((a, b) => b.month.localeCompare(a.month));
    if (isPlatform) return all;
    return all.filter((p) => p.tenantId === tenantId);
  }, [isPlatform, tenantId, billingData]);

  const currentMonth = "2026-03";
  const currentPeriod = periods.find((p) => p.month === currentMonth && (isPlatform || p.tenantId === tenantId));

  const activeAddOns = useMemo(() => {
    return TENANT_ADD_ONS
      .filter((ta) => ta.tenantId === tenantId && !ta.cancelledAt)
      .map((ta) => ({ ...ta, addOn: ADD_ONS_CATALOG.find((a) => a.id === ta.addOnId) }))
      .filter((ta): ta is typeof ta & { addOn: NonNullable<typeof ta.addOn> } => !!ta.addOn);
  }, [tenantId]);

  const addOnMonthlyCost = activeAddOns
    .filter((ta) => ta.addOn.priceType === "flat_monthly")
    .reduce((s, ta) => s + ta.addOn.price, 0);

  const totalPending = periods.filter((p) => p.status === "pending").reduce((s, p) => s + p.total, 0);
  const totalInvoiced = periods.filter((p) => p.status === "invoiced").reduce((s, p) => s + p.total, 0);
  const totalPaid = periods.filter((p) => p.status === "paid").reduce((s, p) => s + p.total, 0);

  function markAsInvoiced(id: string) {
    setBillingData((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "invoiced" as const, invoicedAt: new Date().toISOString() } : p
      )
    );
  }

  function markAsPaid(id: string) {
    setBillingData((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "paid" as const, paidAt: new Date().toISOString() } : p
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isPlatform ? "Facturacion" : "Mi plan CanchaPro"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isPlatform
            ? "Estado de facturacion de todos los clubes. Corte: fin de cada mes."
            : "Detalle de tu consumo y facturacion mensual. Corte: fin de mes."}
        </p>
      </div>

      {/* Current period highlight (club admin) */}
      {currentPeriod && !isPlatform && (
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-sm">Periodo actual — {formatMonth(currentMonth)}</p>
              <p className="text-xs text-blue-300">Corte: 31 de marzo 2026</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-3xl font-bold">{currentPeriod.completedBookings.toLocaleString()}</p>
              <p className="text-xs text-blue-300 mt-1">Reservas completadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                S/ {(currentPeriod.total + addOnMonthlyCost).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-300 mt-1">Total estimado</p>
            </div>
            <div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-300">Base mensual</span>
                  <span>S/ {currentPeriod.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">{currentPeriod.completedBookings.toLocaleString()} × S/ 0.50</span>
                  <span>S/ {currentPeriod.perBookingFee.toFixed(2)}</span>
                </div>
                {activeAddOns.filter((ta) => ta.addOn.priceType === "flat_monthly").map((ta) => (
                  <div key={ta.id} className="flex justify-between">
                    <span className="text-blue-300 truncate mr-2">{ta.addOn.name}</span>
                    <span className="shrink-0">{ta.addOn.priceLabel}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-white/20 pt-1 font-semibold">
                  <span>Total</span>
                  <span>S/ {(currentPeriod.total + addOnMonthlyCost).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-300">
            <AlertCircle className="w-3.5 h-3.5" />
            El monto final se calcula al cierre del mes con las reservas completadas.
          </div>
        </div>
      )}

      {/* Active add-ons card (club admin) */}
      {!isPlatform && activeAddOns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Módulos activos</h2>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-medium"
            >
              Gestionar
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeAddOns.map((ta) => (
              <div key={ta.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ta.addOn.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ta.addOn.category}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">{ta.addOn.priceLabel}</span>
              </div>
            ))}
          </div>
          {addOnMonthlyCost > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total add-ons / mes</span>
              <span className="text-sm font-bold text-gray-900">S/ {addOnMonthlyCost.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Platform KPIs */}
      {isPlatform && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Por cobrar (pendiente)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">S/ {totalPending.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Facturado (por pagar)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">S/ {totalInvoiced.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Cobrado</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">S/ {totalPaid.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* Billing history table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historial de facturacion</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {isPlatform && <th className="text-left px-5 py-3 font-medium text-gray-500">Club</th>}
                <th className="text-left px-5 py-3 font-medium text-gray-500">Periodo</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Reservas</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Total</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Pago</th>
                {isPlatform && <th className="text-right px-5 py-3 font-medium text-gray-500">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map((p) => {
                const tenant = getTenantById(p.tenantId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {isPlatform && (
                      <td className="px-5 py-3 font-medium text-gray-900">{tenant?.name ?? p.tenantId}</td>
                    )}
                    <td className="px-5 py-3 text-gray-900 font-medium capitalize">{formatMonth(p.month)}</td>
                    <td className="px-5 py-3 text-right text-gray-900">{p.completedBookings.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">S/ {p.total.toFixed(2)}</td>
                    <td className="px-5 py-3 text-center">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    {isPlatform && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {p.status === "pending" && (
                            <button
                              onClick={() => markAsInvoiced(p.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Marcar como facturado"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Facturar
                            </button>
                          )}
                          {p.status === "invoiced" && (
                            <button
                              onClick={() => markAsPaid(p.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Registrar pago"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Registrar pago
                            </button>
                          )}
                          {p.status === "paid" && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {periods.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Sin historial de facturacion</p>
        )}
      </div>

    </div>
  );
}
