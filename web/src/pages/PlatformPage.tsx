import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import { api } from "@/lib/api";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  city: string;
  courts: number;
  members: number;
  monthlyRevenue: number;
  plan: "starter" | "pro" | "business";
  status: "active" | "trial" | "suspended";
  branding: { clubName: string; primaryColor: string };
  createdAt: string;
}
import {
  Building2,
  Search,
  Users,
  TrendingUp,
  Ban,
  PlayCircle,
  LogIn,
  ChevronUp,
  MapPin,
  CalendarDays,
  Clock,
  UserCog,
  Plus,
} from "lucide-react";
import PadelIcon from "@/components/PadelIcon";

function getPlanBadge(plan: Tenant["plan"]) {
  const styles = {
    starter: "bg-gray-100 text-gray-600",
    pro: "bg-blue-100 text-blue-700",
    business: "bg-amber-100 text-amber-700",
  };
  const labels = { starter: "Starter", pro: "Pro", business: "Business" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[plan]}`}>
      {labels[plan]}
    </span>
  );
}

function getStatusBadge(status: Tenant["status"]) {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-blue-100 text-blue-700",
    suspended: "bg-red-100 text-red-700",
  };
  const labels = { active: "Activo", trial: "Trial", suspended: "Suspendido" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function PlatformPage() {
  const navigate = useNavigate();
  const impersonate = useAuthStore((s) => s.impersonate);
  const setBranding = useBrandingStore((s) => s.setBranding);
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Tenant[] }>("/v1/platform/tenants")
      .then((res) => setTenants(res.data))
      .catch(() => {});
  }, []);

  function handleImpersonate(t: Tenant) {
    setBranding({ clubName: t.branding.clubName, primaryColor: t.branding.primaryColor, logoUrl: null });
    impersonate(t.id, t.name);
    navigate("/");
  }

  function toggleTenantStatus(id: string) {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "suspended" ? "active" as const : "suspended" as const }
          : t
      )
    );
  }

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase())
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  const activeTenants = tenants.filter((t) => t.status !== "suspended");
  const activeCount = activeTenants.filter((t) => t.status === "active").length;
  const totalMembers = tenants.reduce((s, t) => s + t.members, 0);
  const totalCourts = tenants.reduce((s, t) => s + t.courts, 0);
  const totalEstReservations = activeTenants.reduce((s, t) => s + Math.round(t.courts * 16 * 0.6 * 30), 0);
  const mrr = activeTenants.length * 99 + totalEstReservations * 0.5;

  const kpis = [
    { label: "Clubes activos", value: activeCount, sub: `${tenants.length} total`, icon: Building2, color: "text-blue-700 bg-blue-50" },
    { label: "MRR", value: `S/ ${mrr.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: `~${totalEstReservations.toLocaleString()} reservas`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Socios totales", value: totalMembers, sub: "Todos los clubes", icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "Canchas", value: totalCourts, sub: "Todos los clubes", icon: PadelIcon, color: "text-amber-600 bg-amber-50" },
  ];

  // ── Per-tenant enriched data ─────────────────────────────────────────────────

  // Per-tenant details are no longer enriched from local mock data.
  // The platform API returns summary info on each tenant directly.
  const tenantDetails = useMemo(() => {
    const map = new Map<string, {
      courts: { name: string; sport: string; isActive: boolean }[];
      sedes: string[];
      schedules: { name: string; isActive: boolean; courts: number }[];
      members: number;
      staff: number;
      admins: number;
      recentBookings: number;
      confirmedBookings: number;
    }>();

    for (const t of tenants) {
      map.set(t.id, {
        courts: [],
        sedes: [],
        schedules: [],
        members: t.members,
        staff: 0,
        admins: 0,
        recentBookings: 0,
        confirmedBookings: 0,
      });
    }
    return map;
  }, [tenants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plataforma CanchaPro</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de administración multi-tenant</p>
        </div>
        <Link
          to="/onboarding"
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo club
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const [iconColor, bgColor] = k.color.split(" ");
          return (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${bgColor}`}>
                <k.icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              <p className="text-[10px] text-gray-400">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar club o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tenants list — expandable cards */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const details = tenantDetails.get(t.id);
          const isExpanded = expandedId === t.id;
          const estReservations = t.status !== "suspended" ? Math.round(t.courts * 16 * 0.6 * 30) : 0;
          const fee = t.status !== "suspended" ? 99 + estReservations * 0.5 : 0;

          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Row header — clickable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Club icon with branding color */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: t.branding.primaryColor + "18" }}
                >
                  <Building2 className="w-4 h-4" style={{ color: t.branding.primaryColor }} />
                </div>

                {/* Name & meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{t.name}</span>
                    {getPlanBadge(t.plan)}
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.city} · {t.courts} canchas · {t.members} socios
                    {fee > 0 && <> · <span className="text-emerald-500 font-medium">S/ {fee.toLocaleString("es-PE", { maximumFractionDigits: 0 })}/mes</span></>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {t.status !== "suspended" && (
                    <button
                      onClick={() => handleImpersonate(t)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      title={`Entrar como admin de ${t.name}`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Entrar
                    </button>
                  )}
                  {t.status === "suspended" ? (
                    <button
                      onClick={() => toggleTenantStatus(t.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Activar
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleTenantStatus(t.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Suspender
                    </button>
                  )}
                </div>

                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${!isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {/* Expanded detail panel */}
              {isExpanded && details && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sedes */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        Sedes ({details.sedes.length})
                      </div>
                      {details.sedes.length > 0 ? (
                        <div className="space-y-1">
                          {details.sedes.map((s) => (
                            <p key={s} className="text-xs text-gray-700">{s}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Sin sedes</p>
                      )}
                    </div>

                    {/* Courts */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <PadelIcon className="w-3.5 h-3.5" />
                        Canchas ({details.courts.length})
                      </div>
                      <div className="space-y-1">
                        {details.courts.map((c) => (
                          <div key={c.name} className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                            <span className="text-xs text-gray-700 truncate">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedules */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        Horarios ({details.schedules.length})
                      </div>
                      {details.schedules.length > 0 ? (
                        <div className="space-y-1">
                          {details.schedules.map((s) => (
                            <div key={s.name} className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
                              <span className="text-xs text-gray-700">{s.name}</span>
                              <span className="text-[10px] text-gray-400">({s.courts} canchas)</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Sin horarios</p>
                      )}
                    </div>

                    {/* People & Activity */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <UserCog className="w-3.5 h-3.5" />
                        Personas
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-gray-500">Socios</span>
                        <span className="text-gray-900 font-medium">{details.members}</span>
                        <span className="text-gray-500">Staff</span>
                        <span className="text-gray-900 font-medium">{details.staff}</span>
                        <span className="text-gray-500">Admins</span>
                        <span className="text-gray-900 font-medium">{details.admins}</span>
                      </div>
                      <div className="pt-1 border-t border-gray-100 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Reservas
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <span className="text-gray-500">Total</span>
                          <span className="text-gray-900 font-medium">{details.recentBookings}</span>
                          <span className="text-gray-500">Confirmadas</span>
                          <span className="text-emerald-600 font-medium">{details.confirmedBookings}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick info row */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span>Slug: <span className="font-medium text-gray-600">{t.slug}</span></span>
                    <span>·</span>
                    <span>
                      Creado:{" "}
                      <span className="font-medium text-gray-600">
                        {new Date(t.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Revenue: <span className="font-medium text-gray-600">S/ {t.monthlyRevenue.toLocaleString("es-PE")}/mes</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No se encontraron clubes</p>
        </div>
      )}
    </div>
  );
}
