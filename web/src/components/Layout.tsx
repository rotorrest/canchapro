import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import { useSedeStore } from "@/store/sedeStore";
import { useTenantData } from "@/hooks/useTenantData";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Headphones,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Palette,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  Wallet,
  X,
  Home,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import PadelIcon from "@/components/PadelIcon";
import { TENANT_ADD_ONS, ADD_ONS_CATALOG } from "@/lib/mock-data";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
  children?: Omit<NavItem, "children">[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const platformSections: NavSection[] = [
  {
    items: [
      { to: "/platform", label: "Clubes", icon: Building2 },
      { to: "/onboarding", label: "Nuevo club", icon: Plus },
      { to: "/billing", label: "Facturacion", icon: Receipt },
      { to: "/tickets", label: "Tickets", icon: Inbox },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    items: [
      { to: "/", label: "Inicio", icon: Home },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operacion",
    items: [
      { to: "/courts", label: "Canchas", icon: PadelIcon },
      { to: "/people", label: "Personas", icon: UserCog },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
      { to: "/bookings", label: "Reservas", icon: CalendarDays },
      { to: "/credits", label: "Creditos", icon: CreditCard },
    ],
  },
  {
    title: "Analisis",
    items: [
      { to: "/reports", label: "Reportes", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Configuracion",
    items: [
      { to: "/billing", label: "Mi plan", icon: Receipt },
      { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
      { to: "/support", label: "Soporte", icon: Headphones },
      {
        to: "/settings",
        label: "Ajustes",
        icon: Settings,
        children: [
          { to: "/branding", label: "Marca", icon: Palette },
          { to: "/cancellation-policy", label: "Cancelaciones", icon: ShieldCheck },
          { to: "/sedes", label: "Sedes", icon: MapPin },
        ],
      },
    ],
  },
];

const staffSections: NavSection[] = [
  {
    items: [
      { to: "/", label: "Inicio", icon: Home },
    ],
  },
  {
    title: "Operacion",
    items: [
      { to: "/courts", label: "Canchas", icon: PadelIcon },
      { to: "/members", label: "Miembros", icon: Users },
      { to: "/bookings", label: "Reservas", icon: CalendarDays },
      { to: "/credits", label: "Creditos", icon: CreditCard },
    ],
  },
  {
    title: "Soporte",
    items: [
      { to: "/support", label: "Soporte", icon: Headphones },
    ],
  },
];

const memberSections: NavSection[] = [
  {
    items: [
      { to: "/", label: "Reservar", icon: CalendarDays },
      { to: "/my-bookings", label: "Mis Reservas", icon: PadelIcon },
      { to: "/balance", label: "Mi Saldo", icon: Wallet },
      { to: "/my-qr", label: "Mi QR", icon: QrCode },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, tenantName, logout, impersonating, impersonatedTenantName, exitImpersonate } = useAuthStore();
  const { branding } = useBrandingStore();
  const { selectedSede, setSelectedSede, reset: resetSede } = useSedeStore();
  const td = useTenantData();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sedeDropdownOpen, setSedeDropdownOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>(null);

  // Reset sede selection when tenant changes
  useEffect(() => { resetSede(); setSedeDropdownOpen(false); }, [td.tenantId]);

  const isPlatform = user?.role === "platform_admin";

  const sections =
    user?.role === "platform_admin"
      ? platformSections
      : user?.role === "super_admin"
        ? adminSections
        : user?.role === "staff"
          ? staffSections
          : memberSections;

  function handleLogout() {
    setSidebarOpen(false);
    resetSede();
    logout();
    navigate("/login");
  }

  const roleLabel =
    user?.role === "platform_admin"
      ? "Plataforma"
      : user?.role === "super_admin"
        ? "Admin"
        : user?.role === "staff"
          ? "Staff"
          : "Socio";

  const isMember = user?.role === "member";

  const activeModules = useMemo(() => {
    if (isPlatform || isMember) return [];
    return TENANT_ADD_ONS
      .filter((ta) => ta.tenantId === td.tenantId && !ta.cancelledAt)
      .map((ta) => ADD_ONS_CATALOG.find((a) => a.id === ta.addOnId))
      .filter(Boolean);
  }, [isPlatform, isMember, td.tenantId]);

  const sidebarBrand = isPlatform ? "CanchaPro" : (tenantName ?? branding.clubName);
  // Branding color only applies to the member (socio) interface
  const sidebarColor = isPlatform || !isMember ? "#1e3a8a" : branding.primaryColor;

  // Flat list of member items for bottom nav
  const memberItems = memberSections.flatMap((s) => s.items);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile overlay — not for members (they use bottom nav) */}
      {sidebarOpen && !isMember && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile for members (they use bottom nav) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform lg:translate-x-0 ${
          isMember ? "hidden lg:flex" : sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: sidebarColor }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            {!isPlatform && branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-7 h-7 rounded" />
            ) : (
              <PadelIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="font-bold text-lg text-white">{sidebarBrand}</span>
          <button
            className="ml-auto lg:hidden text-blue-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sede switcher — admin/staff only, multi-sede tenants only */}
        {(user?.role === "super_admin" || user?.role === "staff") && td.hasMultipleSedes && (
          <div className="border-b border-white/10">
            <button
              onClick={() => setSedeDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-white/80" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider leading-none mb-0.5">Sede activa</p>
                <p className="text-sm font-semibold text-white truncate">
                  {selectedSede ? td.sedes.find((s) => s.id === selectedSede)?.name : "Todas las sedes"}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-200 ${sedeDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {sedeDropdownOpen && (
              <div className="mx-3 mb-3 rounded-xl overflow-hidden bg-black/20 border border-white/10">
                {/* Todas las sedes */}
                <button
                  onClick={() => { setSelectedSede(null); setSedeDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${
                    selectedSede === null
                      ? "bg-white/15"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedSede === null ? "text-white" : "text-white/70"}`}>
                      Todas las sedes
                    </p>
                  </div>
                  {selectedSede === null && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                {/* Individual sedes */}
                {td.sedes.map((sede) => (
                  <button
                    key={sede.id}
                    onClick={() => { setSelectedSede(sede.id); setSedeDropdownOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${
                      selectedSede === sede.id
                        ? "bg-white/15"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${selectedSede === sede.id ? "text-white" : "text-white/70"}`}>
                        {sede.name}
                      </p>
                      <p className="text-xs text-white/35 truncate mt-0.5">{sede.address}</p>
                    </div>
                    {selectedSede === sede.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav sections */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const active = link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname === link.to || location.pathname.startsWith(link.to + "/");
                  const childActive = link.children?.some((c) =>
                    location.pathname === c.to || location.pathname.startsWith(c.to + "/")
                  );
                  const isExpanded = expandedNav === link.to || childActive;

                  if (link.children) {
                    return (
                      <div key={link.to}>
                        <button
                          onClick={() => setExpandedNav(isExpanded && !childActive ? null : link.to)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            childActive
                              ? "bg-white/15 text-white"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <link.icon className="w-5 h-5 shrink-0" />
                          <span className="flex-1 text-left">{link.label}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                            {link.children.map((child) => {
                              const childIsActive = location.pathname === child.to || location.pathname.startsWith(child.to + "/");
                              return (
                                <Link
                                  key={child.to}
                                  to={child.to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    childIsActive
                                      ? "bg-white/15 text-white"
                                      : "text-white/60 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <child.icon className="w-4 h-4 shrink-0" />
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return link.soon ? (
                    <div
                      key={link.to}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/25 cursor-default"
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                      <span className="ml-auto text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">
                        Pronto
                      </span>
                    </div>
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {activeModules.length > 0 && (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Módulos activos
              </p>
              <div className="space-y-0.5">
                {activeModules.map((mod) => {
                  const isActive = location.pathname === `/modules/${mod.id}`;
                  return (
                    <Link
                      key={mod.id}
                      to={`/modules/${mod.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      {mod.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Build date + User info */}
        <div className="border-t border-white/10">
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] text-blue-400/60 text-center">
              Build: {new Date(__BUILD_DATE__).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="p-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-blue-300">{roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-blue-400 hover:text-red-400 transition-colors"
                title="Cerrar sesion"
                aria-label="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar — mobile only, hidden on desktop */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          {!isMember && (
            <button
              className="lg:hidden text-gray-500"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-base font-semibold text-gray-900 lg:hidden flex-1">{sidebarBrand}</span>
          <div className="lg:hidden flex items-center gap-2">
            {isMember ? (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <>
                <span className="text-xs text-gray-400">{roleLabel}</span>
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                  {user?.name?.charAt(0)}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Impersonation banner */}
        {impersonating && (
          <div className="bg-amber-400 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
              Viendo como: <strong>{impersonatedTenantName}</strong>
            </div>
            <button
              onClick={() => { exitImpersonate(); navigate("/platform"); }}
              className="text-xs font-semibold text-amber-900 bg-amber-200 hover:bg-amber-100 px-3 py-1 rounded-lg transition-colors"
            >
              Volver a plataforma
            </button>
          </div>
        )}

        {/* Page content — extra padding bottom on mobile for members (bottom nav) */}
        <main className={`flex-1 p-4 lg:p-8 overflow-auto ${isMember ? "pb-20 lg:pb-8" : ""}`}>
          {children}
        </main>

        {/* Bottom nav — member mobile only */}
        {isMember && (
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around h-16 px-2 safe-area-bottom">
            {memberItems.map((link) => {
              const active = link.to === "/"
                ? location.pathname === "/"
                : location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                    active
                      ? "text-blue-700"
                      : "text-gray-400"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
