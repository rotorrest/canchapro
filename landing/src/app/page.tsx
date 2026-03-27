import {
  CalendarDays,
  CreditCard,
  BarChart3,
  Users,
  Shield,
  QrCode,
  Clock,
  Building2,
  ChevronRight,
  ChevronDown,
  Check,
  ArrowRight,
  Briefcase,
  ScanLine,
  Wallet,
} from "lucide-react";
import RotatingHero from "@/components/RotatingHero";

/* ─── Logo icon ───────────────────────────────────────────────────────────── */
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

/* ─── Features ────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: CalendarDays,
    title: "Reservas en tiempo real",
    desc: "Tus socios o clientes ven disponibilidad al instante y reservan sin llamadas, sin mensajes cruzados y sin errores de coordinacion.",
  },
  {
    icon: Wallet,
    title: "Cobros, creditos y paquetes",
    desc: "Configura precios por horario, tipo de cancha o dia. Vende creditos, paquetes o reservas individuales y registra cada transaccion.",
  },
  {
    icon: Users,
    title: "Gestion de socios y clientes",
    desc: "Administra altas, suspensiones, estados, historial y saldos desde un solo lugar. Para clubs con membresia o complejos con clientes por reserva.",
  },
  {
    icon: BarChart3,
    title: "Dashboard y metricas",
    desc: "Mide ocupacion por cancha, ingresos, cancelaciones y horarios mas demandados para tomar mejores decisiones.",
  },
  {
    icon: Clock,
    title: "Horarios y bloqueos",
    desc: "Configura apertura, cierre, mantenimiento, eventos y bloqueos por cancha o por sede, con deteccion de conflictos.",
  },
  {
    icon: Shield,
    title: "Roles y permisos",
    desc: "Administra lo que ve y hace cada perfil: administracion, staff, recepcion, entrenadores o socios.",
  },
  {
    icon: QrCode,
    title: "QR y control de acceso",
    desc: "Cada socio o cliente puede identificarse con QR, con opcion de integracion futura para control de acceso fisico con RFID.",
  },
  {
    icon: Building2,
    title: "Multi-sede",
    desc: "Gestiona varias sedes desde una sola plataforma, con configuracion independiente por deporte, cancha, precios y usuarios.",
  },
];

/* ─── Sports ──────────────────────────────────────────────────────────────── */
const sports = [
  { name: "Voley", emoji: "🏐" },
  { name: "Basquet", emoji: "🏀" },
  { name: "Squash", emoji: "🎾" },
  { name: "Padel", emoji: "🏓" },
  { name: "Tenis", emoji: "🎾" },
  { name: "Futbol", emoji: "⚽" },
];

/* ─── User types ──────────────────────────────────────────────────────────── */
const userTypes = [
  {
    title: "Para administracion",
    icon: Briefcase,
    items: ["Control de ingresos y cobros", "Metricas de ocupacion", "Gestion de sedes y canchas", "Permisos y accesos", "Reportes exportables"],
  },
  {
    title: "Para staff y recepcion",
    icon: ScanLine,
    items: ["Reservas y check-in rapido", "Cobros y venta de creditos", "Bloqueos y horarios", "Menos errores operativos", "Vista de agenda diaria"],
  },
  {
    title: "Para socios y clientes",
    icon: CalendarDays,
    items: ["Reserva simple desde el celular", "Disponibilidad en tiempo real", "Historial y saldo de creditos", "QR de acceso personal", "Sin llamadas ni WhatsApp"],
  },
];

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
const plans = [
  {
    name: "Starter",
    courts: "1-2 canchas",
    base: "Gratis",
    fee: "S/ 1.00",
    feeLabel: "por reserva",
    note: "150 reservas gratis/mes",
    highlighted: false,
    features: ["Reservas online", "Gestion de socios", "Cobros y creditos", "Horarios y bloqueos"],
    cta: "Empezar gratis",
  },
  {
    name: "Pro",
    courts: "3-9 canchas",
    base: "S/ 79",
    fee: "S/ 0.80",
    feeLabel: "por reserva",
    note: "Reservas ilimitadas",
    highlighted: true,
    features: ["Todo en Starter", "Dashboard y metricas", "QR check-in", "Reportes exportables", "WhatsApp Recordatorios", "Soporte WhatsApp"],
    cta: "14 dias gratis",
  },
  {
    name: "Business",
    courts: "10+ canchas o multi-sede",
    base: "S/ 149",
    fee: "S/ 0.50",
    feeLabel: "por reserva",
    note: "Fee reducido por volumen",
    highlighted: false,
    features: ["Todo en Pro", "Multi-sede", "Branding personalizado", "WhatsApp Recordatorios", "Soporte prioritario", "API access"],
    cta: "Contactar ventas",
  },
];

/* ─── How it works ────────────────────────────────────────────────────────── */
const steps = [
  { num: "01", title: "Configura tu operacion", desc: "Canchas, horarios, precios, usuarios y reglas de reserva en pocos minutos." },
  { num: "02", title: "Activa a tu equipo y socios", desc: "Invita a tu staff, habilita accesos y empieza a tomar reservas desde el primer dia." },
  { num: "03", title: "Opera con control", desc: "Centraliza reservas, cobros y reportes en una sola plataforma. Toma decisiones con datos reales." },
];

/* ─── FAQ ─────────────────────────────────────────────────────────────────── */
const faqs = [
  { q: "Funciona para varios deportes?", a: "Si. CanchaPro esta disenado para cualquier deporte que opere por cancha y horario: voley, basquet, padel, tenis, futbol, squash y mas." },
  { q: "Puedo administrar distintas canchas con distintos horarios?", a: "Si. Cada cancha tiene su propia configuracion de horarios, precios y reglas de bloqueo." },
  { q: "Sirve para una sola sede o para varias?", a: "Ambos. Puedes operar una sede o multiples ubicaciones desde la misma plataforma, cada una con su configuracion independiente." },
  { q: "Mis socios necesitan descargar una app?", a: "No. Los socios acceden desde el navegador de su celular. No necesitan descargar nada." },
  { q: "Puedo vender creditos, paquetes o cobrar por reserva?", a: "Si. El sistema soporta creditos prepagados, paquetes y cobro por reserva individual. Tu eliges el modelo." },
  { q: "Que pasa con cancelaciones o reprogramaciones?", a: "Puedes configurar politicas de cancelacion con ventanas de tiempo y porcentajes de reembolso. Tambien hay exenciones por socio." },
  { q: "Puedo reservar desde recepcion o solo el socio?", a: "Ambos. El staff puede crear reservas desde el panel, y los socios pueden reservar por su cuenta." },
  { q: "Cuanto demora implementarlo?", a: "La configuracion basica toma menos de 30 minutos. No requiere instalacion ni conocimientos tecnicos." },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">CanchaPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#sports" className="hover:text-gray-900 transition-colors">Deportes</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Precios</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900 transition-colors">Iniciar sesion</a>
            <a href="#pricing" className="bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors">
              Probar gratis
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Sin tarjeta. Sin instalacion. Listo para operar en minutos.
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            El sistema operativo para{" "}
            <span className="text-brand-700">tu club o complejo deportivo</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Gestiona reservas, socios, cobros y operacion diaria para voley, basquet, squash, padel, tenis, futbol y mas.
          </p>
          <RotatingHero />
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#pricing" className="w-full sm:w-auto bg-brand-700 text-white font-medium px-8 py-3.5 rounded-xl text-base hover:bg-brand-800 transition-colors flex items-center justify-center gap-2">
              Probar gratis 14 dias <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#how" className="w-full sm:w-auto border border-gray-200 text-gray-700 font-medium px-8 py-3.5 rounded-xl text-base hover:bg-gray-50 transition-colors text-center">
              Ver como funciona
            </a>
          </div>
          {/* Sport chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {sports.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-sm text-gray-600 px-3 py-1.5 rounded-full">
                <span>{s.emoji}</span> {s.name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Usado por clubes y complejos deportivos en Peru, Colombia y Mexico
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Todo lo que necesitas para operar tus canchas con orden
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Desde la reserva hasta el cobro, pasando por accesos, staff y metricas. Disenado para la operacion real de clubes y complejos deportivos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-brand-200 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sports ──────────────────────────────────────────────────────────── */}
      <section id="sports" className="py-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Pensado para deportes que operan por cancha y horario
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Si tu operacion depende de horarios, disponibilidad, cobros y control de uso de canchas, CanchaPro puede adaptarse a tu club.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {sports.map((s) => (
              <div key={s.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                <div className="text-3xl mb-2">{s.emoji}</div>
                <p className="text-sm font-medium text-gray-700">{s.name}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">Y otros formatos similares que operan con canchas y horarios.</p>
        </div>
      </section>

      {/* ── User types ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Valor para cada parte de tu operacion
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Cada perfil ve lo que necesita y opera con confianza.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userTypes.map((ut) => (
              <div key={ut.title} className="bg-white rounded-2xl border border-gray-100 p-7">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <ut.icon className="w-5 h-5 text-brand-700" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-4">{ut.title}</h3>
                <ul className="space-y-2.5">
                  {ut.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Arranca en minutos, no en meses
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              No necesitas instalar nada. Solo un navegador y ganas de profesionalizar tu operacion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center md:text-left">
                <div className="text-5xl font-bold text-brand-100 mb-3">{s.num}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product mockup ──────────────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Asi se ve CanchaPro por dentro</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Agenda de canchas", items: ["Cancha voley 1 — 09:00 Reservada", "Cancha futbol 5 — 10:00 Libre", "Cancha tenis 2 — 11:00 Reservada", "Cancha basquet A — 12:00 Libre"] },
              { label: "Cobros y creditos", items: ["Paquete 20 sesiones — S/ 180", "Creditos Pedro: 12/20", "Venta Yape — +10 cr", "Reserva individual — S/ 25"] },
              { label: "Dashboard", items: ["Ocupacion: 73%", "Reservas hoy: 24", "Ingresos marzo: S/ 12,400", "Cancelaciones: 4%"] },
              { label: "Multi-sede", items: ["Sede Norte — 4 canchas", "Sede Sur — 3 canchas", "Sede Centro — 6 canchas", "Total: 13 canchas activas"] },
            ].map((mock) => (
              <div key={mock.label} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 px-3 py-2">
                  <p className="text-xs font-medium text-gray-300">{mock.label}</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {mock.items.map((item) => (
                    <div key={item} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Un precio que crece con tu operacion
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Base fija + un fee por reserva generada. Mientras mas creces, menos pagas por reserva.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border overflow-hidden flex flex-col ${plan.highlighted ? "border-brand-300 shadow-lg shadow-brand-100/50 ring-1 ring-brand-200" : "border-gray-200"}`}>
                {plan.highlighted && (
                  <div className="bg-brand-700 text-white text-center text-xs font-semibold py-1.5">Mas popular</div>
                )}
                <div className="p-7 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{plan.courts}</p>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.base}</span>
                      {plan.base !== "Gratis" && <span className="text-sm text-gray-500">/mes</span>}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-semibold text-brand-700">+ {plan.fee}</span>
                      <span className="text-sm text-gray-500">{plan.feeLabel}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{plan.note}</p>
                  </div>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#" className={`mt-7 block text-center font-medium text-sm py-3 rounded-xl transition-colors ${plan.highlighted ? "bg-brand-700 text-white hover:bg-brand-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {plan.cta} <ChevronRight className="w-4 h-4 inline" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            El fee por reserva aplica sobre reservas efectivamente generadas en la plataforma. Cancelaciones y no-show no se cobran.
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            14 dias gratis. Sin tarjeta de credito. Sin permanencia.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between text-sm font-medium text-gray-900 hover:text-brand-700 transition-colors list-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────────────────────── */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">50+</p>
              <p className="text-sm text-gray-500 mt-1">Canchas gestionadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">12,000+</p>
              <p className="text-sm text-gray-500 mt-1">Reservas procesadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">8</p>
              <p className="text-sm text-gray-500 mt-1">Sedes activas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">3</p>
              <p className="text-sm text-gray-500 mt-1">Paises</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-brand-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Tu operacion no deberia depender de WhatsApp y Excel
          </h2>
          <p className="mt-4 text-lg text-brand-200 max-w-xl mx-auto">
            Centraliza reservas, cobros, usuarios y reportes en una sola plataforma y opera con mas control desde el primer dia.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#pricing" className="w-full sm:w-auto bg-white text-brand-900 font-medium px-8 py-3.5 rounded-xl text-base hover:bg-brand-50 transition-colors flex items-center justify-center gap-2">
              Probar gratis 14 dias <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#" className="w-full sm:w-auto border border-brand-700 text-brand-200 font-medium px-8 py-3.5 rounded-xl text-base hover:bg-brand-800 transition-colors text-center">
              Agendar demo
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-700 rounded-lg flex items-center justify-center">
              <LogoIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">CanchaPro</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#sports" className="hover:text-gray-900 transition-colors">Deportes</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Precios</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contacto</a>
          </div>
          <p className="text-sm text-gray-400">
            Hecho por{" "}
            <a href="https://lumini.dev" className="text-brand-600 hover:text-brand-700 transition-colors" target="_blank" rel="noopener noreferrer">
              Lumini
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
