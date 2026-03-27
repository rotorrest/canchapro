import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTenantData } from "@/hooks/useTenantData";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Users,
  Wallet,
} from "lucide-react";
import PadelIcon from "@/components/PadelIcon";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const td = useTenantData();
  const firstName = user?.name?.split(" ")[0] ?? "";

  const isAdmin = user?.role === "super_admin";
  const isStaff = user?.role === "staff";
  const isMember = user?.role === "member";

  const adminModules = [
    { to: "/dashboard", label: "Dashboard", desc: "Metricas y reportes del club", icon: LayoutDashboard },
    { to: "/agenda", label: "Agenda", desc: "Vista calendario de reservas", icon: LayoutGrid },
    { to: "/courts", label: "Canchas", desc: `${td.courts.filter((c) => c.isActive).length} canchas activas`, icon: PadelIcon },
    { to: "/schedules", label: "Horarios", desc: "Configurar horarios de operacion", icon: Clock },
    { to: "/members", label: "Miembros", desc: `${td.members.filter((m) => m.user.status === "active").length} miembros activos`, icon: Users },
    { to: "/bookings", label: "Reservas", desc: `${td.bookings.filter((b) => b.status === "confirmed").length} confirmadas`, icon: CalendarDays },
    { to: "/credits", label: "Creditos", desc: "Venta de creditos y precios", icon: CreditCard },
  ];

  const staffModules = [
    { to: "/agenda", label: "Agenda", desc: "Vista calendario de reservas", icon: LayoutGrid },
    { to: "/credits", label: "Vender creditos", desc: "Registrar venta a un socio", icon: CreditCard },
    { to: "/members", label: "Miembros", desc: "Agregar o gestionar socios", icon: Users },
    { to: "/bookings", label: "Reservas", desc: "Ver todas las reservas", icon: CalendarDays },
    { to: "/courts", label: "Canchas", desc: "Horarios y bloqueos", icon: PadelIcon },
    { to: "/schedules", label: "Horarios", desc: "Configurar horarios de operacion", icon: Clock },
  ];

  const memberModules = [
    { to: "/", label: "Reservar cancha", desc: "Elige cancha, fecha y horario", icon: CalendarDays },
    { to: "/my-bookings", label: "Mis Reservas", desc: "Proximas y pasadas", icon: PadelIcon },
    { to: "/balance", label: "Mi Saldo", desc: "Creditos y transacciones", icon: Wallet },
  ];

  const modules = isAdmin ? adminModules : isStaff ? staffModules : memberModules;
  const greeting = isAdmin
    ? "Administra tu club desde aqui."
    : isStaff
      ? "Que necesitas hacer hoy?"
      : "Que quieres hacer hoy?";

  const now = new Date().toISOString();
  const nextBooking = td.bookings
    .filter((b) => b.status === "confirmed" && b.startTime >= now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, <span className="text-blue-700">{firstName}</span>
        </h1>
        <p className="text-gray-500 mt-1">{greeting}</p>
      </div>

      {/* Next booking highlight (admin & staff) */}
      {!isMember && nextBooking && (
        <Link
          to="/bookings"
          className="block bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between hover:bg-blue-100/60 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Proxima reserva</p>
              <p className="text-sm text-gray-500">
                {nextBooking.memberName} &middot; {nextBooking.courtName} &middot;{" "}
                {new Date(nextBooking.startTime).toLocaleDateString("es-PE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                {new Date(nextBooking.startTime).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-sm font-medium text-blue-700 bg-white border border-blue-200 px-4 py-2 rounded-lg">
            Ver <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      {/* Modules grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isMember ? "Accesos rapidos" : "Modulos"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.to + mod.label}
              to={mod.to}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <mod.icon className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{mod.label}</p>
                  <p className="text-sm text-gray-500">{mod.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
