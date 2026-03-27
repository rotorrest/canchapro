import { getMemberByUserId } from "@/lib/mock-data";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import { useBrandingStore } from "@/store/brandingStore";
import { ArrowDownLeft, Coins, RefreshCcw, Wrench } from "lucide-react";

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  allocation: { icon: RefreshCcw, color: "text-blue-600 bg-blue-50", label: "Asignacion" },
  deduction: { icon: ArrowDownLeft, color: "text-red-500 bg-red-50", label: "Deduccion" },
  adjustment: { icon: Wrench, color: "text-amber-600 bg-amber-50", label: "Ajuste" },
};

export default function BalancePage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const { branding } = useBrandingStore();
  const member = user ? getMemberByUserId(user.id) : undefined;

  if (!member) return null;

  const myTransactions = td.transactions.filter((t) => t.memberId === member.id);
  const used = member.creditAllocationMonthly - member.creditBalance;
  const usedPct = Math.round((used / member.creditAllocationMonthly) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Saldo</h1>

      {/* Balance card — uses club branding color */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryColor}cc 100%)` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <p className="text-blue-200 text-sm">Creditos disponibles</p>
        </div>
        <p className="text-4xl font-bold">{member.creditBalance}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-blue-300 mb-1">
            <span>Usados este mes</span>
            <span>
              {used} / {member.creditAllocationMonthly}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Historial de transacciones</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {myTransactions.map((tx) => {
            const cfg = typeConfig[tx.type] ?? typeConfig.adjustment;
            const Icon = cfg.icon;
            return (
              <div key={tx.id} className="px-5 py-3 flex items-center gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                  <p className="text-xs text-gray-500 truncate">{tx.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amount >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount} cr
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
