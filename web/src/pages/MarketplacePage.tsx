import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  ADD_ONS_CATALOG,
  BUNDLES,
  TENANT_ADD_ONS,
  getTenantById,
} from "@/lib/mock-data";
import type { AddOn, Bundle, TenantAddOn } from "@/lib/mock-data";
import {
  MessageCircle,
  Link as LinkIcon,
  CreditCard,
  MapPin,
  Mail,
  Trophy,
  Users,
  ScanLine,
  Package,
  Check,
  Plus,
  X,
  ShoppingBag,
  Search,
  CalendarDays,
  Receipt,
  Clock,
  GraduationCap,
  Split,
  Handshake,
  Star,
  Gift,
  FileText,
  Globe,
  Lock,
  TrendingUp,
  Wallet,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "message-circle": MessageCircle,
  "link": LinkIcon,
  "credit-card": CreditCard,
  "map-pin": MapPin,
  "mail": Mail,
  "trophy": Trophy,
  "users": Users,
  "scan-line": ScanLine,
  "package": Package,
  "clock": Clock,
  "graduation-cap": GraduationCap,
  "split": Split,
  "handshake": Handshake,
  "star": Star,
  "gift": Gift,
  "file-text": FileText,
  "globe": Globe,
  "trending-up": TrendingUp,
  "wallet": Wallet,
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  roi:        { label: "Alto ROI",     color: "bg-emerald-100 text-emerald-700" },
  ops:        { label: "Operacion",    color: "bg-blue-100 text-blue-700" },
  engagement: { label: "Engagement",  color: "bg-purple-100 text-purple-700" },
  soon:       { label: "Proximamente", color: "bg-gray-100 text-gray-500" },
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  flat_monthly: "Fijo mensual",
  per_unit:     "Por unidad",
  percentage:   "Porcentaje",
};

const CATEGORIES = ["Todos", "Ocupacion", "Cobros", "Operacion", "Engagement"];

function AddOnIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] ?? Package;
  return <Icon className={className} />;
}

// ── Bundle Card ───────────────────────────────────────────────────────────────

function BundleCard({
  bundle,
  isActive,
  onActivate,
  onDeactivate,
}: {
  bundle: Bundle;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const includedAddOns = bundle.addOnIds
    .map((id) => ADD_ONS_CATALOG.find((a) => a.id === id))
    .filter(Boolean) as AddOn[];

  const savings = bundle.originalPrice - bundle.price;

  return (
    <div
      className={`relative bg-white rounded-2xl border overflow-hidden transition-all ${
        isActive
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Savings ribbon */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          <Zap className="w-3 h-3" />
          Ahorra S/ {savings}/mes
        </span>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 pr-24">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-blue-100" : "bg-gray-100"}`}>
            <AddOnIcon icon={bundle.icon} className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-gray-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">{bundle.name}</h3>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Activo
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${bundle.badgeColor}`}>
              {bundle.badgeLabel}
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm font-semibold text-gray-800 mt-3">{bundle.tagline}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{bundle.description}</p>

        {/* Included modules */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {includedAddOns.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
            >
              <AddOnIcon icon={a.icon} className="w-3 h-3" />
              {a.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-gray-900">{bundle.priceLabel}</p>
            <p className="text-xs text-gray-400 line-through">S/ {bundle.originalPrice}/mes</p>
          </div>
          <p className="text-[10px] text-gray-400">Fijo mensual · cancela cuando quieras</p>
        </div>

        {isActive ? (
          <button
            onClick={onDeactivate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Activar paquete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add-on Card ───────────────────────────────────────────────────────────────

function AddOnCard({
  addOn,
  active,
  available,
  onActivate,
  onDeactivate,
}: {
  addOn: AddOn;
  active: boolean;
  available: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const tier = TIER_CONFIG[addOn.tier];

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-all ${
        active
          ? "border-blue-300 ring-1 ring-blue-100"
          : !available
            ? "border-gray-200 opacity-60"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-blue-100" : "bg-gray-100"}`}>
            <AddOnIcon icon={addOn.icon} className={`w-5 h-5 ${active ? "text-blue-700" : "text-gray-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{addOn.name}</h3>
              {active && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Activo
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tier.color}`}>
                {tier.label}
              </span>
              {addOn.status === "beta" && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Beta
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{addOn.description}</p>

        {addOn.roiHint && (
          <div className="mt-2.5 flex items-start gap-1.5 bg-emerald-50 rounded-lg px-3 py-2">
            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-700 leading-relaxed">{addOn.roiHint}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">{addOn.priceLabel}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{PRICE_TYPE_LABELS[addOn.priceType]}</p>
        </div>

        {!available ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-lg">
            <Lock className="w-3 h-3" />
            Plan Pro+
          </span>
        ) : active ? (
          <button
            onClick={onDeactivate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Desactivar
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Activar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { tenantId } = useAuthStore();
  const tenant = tenantId ? getTenantById(tenantId) : null;

  const [tenantAddOns, setTenantAddOns] = useState<TenantAddOn[]>(TENANT_ADD_ONS);
  const [activeBundles, setActiveBundles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"bundles" | "modules">("bundles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [confirmModal, setConfirmModal] = useState<
    | { kind: "addon"; addOn: AddOn; action: "activate" | "deactivate" }
    | { kind: "bundle"; bundle: Bundle; action: "activate" | "deactivate" }
    | null
  >(null);

  const activeAddOnIds = useMemo(
    () => new Set(tenantAddOns.filter((ta) => ta.tenantId === tenantId && !ta.cancelledAt).map((ta) => ta.addOnId)),
    [tenantAddOns, tenantId]
  );

  const monthlyAddOnCost = useMemo(() => {
    return ADD_ONS_CATALOG.filter((a) => activeAddOnIds.has(a.id) && a.priceType === "flat_monthly")
      .reduce((s, a) => s + a.price, 0);
  }, [activeAddOnIds]);

  const catalog = useMemo(() => {
    let items = ADD_ONS_CATALOG.filter((a) => a.status !== "deprecated");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "Todos") {
      items = items.filter((a) => a.category === selectedCategory);
    }
    return items;
  }, [searchQuery, selectedCategory]);

  const isAddOnAvailable = (addOn: AddOn) =>
    !tenant || addOn.availableOnPlans.includes(tenant.plan);

  function handleActivateAddOn(addOn: AddOn) {
    setTenantAddOns((prev) => {
      const existing = prev.find((ta) => ta.tenantId === tenantId && ta.addOnId === addOn.id);
      if (existing) return prev.map((ta) => ta.id === existing.id ? { ...ta, cancelledAt: null, activatedAt: new Date().toISOString() } : ta);
      return [...prev, { id: `ta-${Date.now()}`, tenantId: tenantId!, addOnId: addOn.id, activatedAt: new Date().toISOString(), cancelledAt: null }];
    });
    setConfirmModal(null);
  }

  function handleDeactivateAddOn(addOn: AddOn) {
    setTenantAddOns((prev) =>
      prev.map((ta) =>
        ta.tenantId === tenantId && ta.addOnId === addOn.id && !ta.cancelledAt
          ? { ...ta, cancelledAt: new Date().toISOString() }
          : ta
      )
    );
    setConfirmModal(null);
  }

  function handleActivateBundle(bundle: Bundle) {
    setActiveBundles((prev) => new Set([...prev, bundle.id]));
    // Also activate all add-ons in the bundle
    bundle.addOnIds.forEach((id) => {
      const addOn = ADD_ONS_CATALOG.find((a) => a.id === id);
      if (addOn) handleActivateAddOn(addOn);
    });
    setConfirmModal(null);
  }

  function handleDeactivateBundle(bundle: Bundle) {
    setActiveBundles((prev) => { const next = new Set(prev); next.delete(bundle.id); return next; });
    setConfirmModal(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-blue-700" />
          Marketplace
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Módulos adicionales que se suman a tu fee mensual.
          {monthlyAddOnCost > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              S/ {monthlyAddOnCost}/mes en add-ons
            </span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("bundles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "bundles" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Paquetes
          <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Ahorra
          </span>
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "modules" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Módulos individuales
        </button>
      </div>

      {/* ── BUNDLES TAB ── */}
      {activeTab === "bundles" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Más valor por menos precio</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Los paquetes combinan los módulos más usados con descuento. Podés cambiar a módulos individuales en cualquier momento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {BUNDLES.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                isActive={activeBundles.has(bundle.id)}
                onActivate={() => setConfirmModal({ kind: "bundle", bundle, action: "activate" })}
                onDeactivate={() => setConfirmModal({ kind: "bundle", bundle, action: "deactivate" })}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveTab("modules")}
            className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium transition-colors"
          >
            Ver todos los módulos individuales
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── MODULES TAB ── */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-800 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {catalog.map((addOn) => (
              <AddOnCard
                key={addOn.id}
                addOn={addOn}
                active={activeAddOnIds.has(addOn.id)}
                available={isAddOnAvailable(addOn)}
                onActivate={() => setConfirmModal({ kind: "addon", addOn, action: "activate" })}
                onDeactivate={() => setConfirmModal({ kind: "addon", addOn, action: "deactivate" })}
              />
            ))}
          </div>

          {catalog.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No se encontraron módulos</p>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setConfirmModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {confirmModal.kind === "bundle" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmModal.action === "activate" ? "bg-blue-100" : "bg-red-100"}`}>
                    <AddOnIcon icon={confirmModal.bundle.icon} className={`w-5 h-5 ${confirmModal.action === "activate" ? "text-blue-700" : "text-red-600"}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {confirmModal.action === "activate" ? "Activar" : "Cancelar"} {confirmModal.bundle.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {confirmModal.action === "activate"
                        ? `${confirmModal.bundle.priceLabel} · ahorra S/ ${confirmModal.bundle.originalPrice - confirmModal.bundle.price}/mes`
                        : "El paquete se desactivará al final del periodo actual"}
                    </p>
                  </div>
                </div>

                {confirmModal.action === "activate" && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                    <p className="font-semibold text-gray-800 mb-2">Incluye:</p>
                    {confirmModal.bundle.addOnIds.map((id) => {
                      const a = ADD_ONS_CATALOG.find((x) => x.id === id);
                      if (!a) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 text-gray-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{a.name}</span>
                          <span className="ml-auto text-gray-400 line-through text-xs">{a.priceLabel}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between font-bold border-t border-blue-200 pt-2 mt-1">
                      <span className="text-gray-900">Total paquete</span>
                      <span className="text-blue-700">{confirmModal.bundle.priceLabel}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => confirmModal.action === "activate" ? handleActivateBundle(confirmModal.bundle) : handleDeactivateBundle(confirmModal.bundle)}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmModal.action === "activate" ? "bg-blue-800 hover:bg-blue-700" : "bg-red-600 hover:bg-red-500"}`}
                  >
                    {confirmModal.action === "activate" ? "Confirmar activación" : "Confirmar cancelación"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmModal.action === "activate" ? "bg-blue-100" : "bg-red-100"}`}>
                    <AddOnIcon icon={confirmModal.addOn.icon} className={`w-5 h-5 ${confirmModal.action === "activate" ? "text-blue-700" : "text-red-600"}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {confirmModal.action === "activate" ? "Activar" : "Desactivar"} {confirmModal.addOn.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {confirmModal.action === "activate"
                        ? `Se añadirá ${confirmModal.addOn.priceLabel} a tu factura mensual`
                        : "Revisa los detalles antes de confirmar"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{confirmModal.addOn.description}</p>

                {confirmModal.addOn.roiHint && (
                  <div className="flex items-start gap-2 bg-emerald-50 rounded-xl p-3 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700">{confirmModal.addOn.roiHint}</p>
                  </div>
                )}

                {confirmModal.action === "deactivate" && confirmModal.addOn.priceType === "flat_monthly" && (() => {
                  const today = new Date(2026, 2, 27);
                  const activeUntil = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                  const currentMonthName = today.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
                  const activeUntilStr = activeUntil.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <Receipt className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Se cobrará el mes completo</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            El periodo de <span className="font-medium capitalize">{currentMonthName}</span> ya está en curso — se facturará{" "}
                            <span className="font-medium">{confirmModal.addOn.priceLabel}</span> al cierre del mes.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Activo hasta el {activeUntilStr}</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Podés seguir usando el módulo hasta esa fecha. A partir del día siguiente se desactiva automáticamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {confirmModal.action === "activate" && confirmModal.addOn.priceType === "flat_monthly" && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fee base actual</span>
                      <span className="font-medium text-gray-900">S/ 99.00/mes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Add-ons activos</span>
                      <span className="font-medium text-gray-900">S/ {monthlyAddOnCost.toFixed(2)}/mes</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-700 font-semibold border-t border-blue-200 pt-2">
                      <span>+ {confirmModal.addOn.name}</span>
                      <span>{confirmModal.addOn.priceLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-blue-200 pt-2">
                      <span className="text-gray-900">Nuevo total fijo</span>
                      <span className="text-gray-900">S/ {(99 + monthlyAddOnCost + confirmModal.addOn.price).toFixed(2)}/mes</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => confirmModal.action === "activate" ? handleActivateAddOn(confirmModal.addOn) : handleDeactivateAddOn(confirmModal.addOn)}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmModal.action === "activate" ? "bg-blue-800 hover:bg-blue-700" : "bg-red-600 hover:bg-red-500"}`}
                  >
                    {confirmModal.action === "activate" ? "Confirmar activación" : "Confirmar desactivación"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
