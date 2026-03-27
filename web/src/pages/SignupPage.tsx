import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import {
  User,
  Building2,
  LayoutGrid,
  Palette,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  CheckCircle,
  ArrowRight,
  Zap,
  MapPin,
  Clock,
} from "lucide-react";
import PadelIcon from "@/components/PadelIcon";
import PhoneInput from "@/components/PhoneInput";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface ClubData {
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  sports: string[];
}

interface SedeData {
  id: string;
  name: string;
  address: string;
}

interface CourtData {
  id: string;
  name: string;
  sport: string;
  type: "indoor" | "outdoor" | "covered";
  surface: string;
}

type PlanChoice = "starter" | "pro" | "business";

interface BrandingData {
  primaryColor: string;
  accentColor: string;
  clubName: string;
  logoUrl: string | null;
}

interface ScheduleDaySetup {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  pricePerSlot: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Tu cuenta", icon: User },
  { id: 1, label: "Tu club", icon: Building2 },
  { id: 2, label: "Canchas", icon: LayoutGrid },
  { id: 3, label: "Horario", icon: Clock },
  { id: 4, label: "Marca", icon: Palette },
  { id: 5, label: "Plan", icon: Zap },
  { id: 6, label: "Listo", icon: Rocket },
];

const DEFAULT_SCHEDULE_DAYS: ScheduleDaySetup[] = [
  { dayOfWeek: 0, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 1, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 2, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 3, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 4, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 5, isClosed: false, openTime: "07:00", closeTime: "22:00", pricePerSlot: 1.5 },
  { dayOfWeek: 6, isClosed: false, openTime: "07:00", closeTime: "22:00", pricePerSlot: 1.5 },
];

const DAY_NAMES_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PLANS_DATA: { id: PlanChoice; name: string; price: string; fee: string; courts: string; popular?: boolean; features: string[] }[] = [
  { id: "starter", name: "Starter", price: "Gratis", fee: "S/ 1.00/reserva", courts: "Hasta 4 canchas", features: ["150 reservas gratis/mes", "Soporte por email"] },
  { id: "pro", name: "Pro", price: "S/ 79/mes", fee: "S/ 0.80/reserva", courts: "Canchas ilimitadas", popular: true, features: ["Reservas ilimitadas", "Multi-sede", "Soporte prioritario", "Add-ons disponibles"] },
  { id: "business", name: "Business", price: "S/ 149/mes", fee: "S/ 0.50/reserva", courts: "Canchas ilimitadas", features: ["Todo en Pro", "Dominio personalizado", "API access", "Soporte dedicado"] },
];

const COUNTRIES_CITIES: Record<string, string[]> = {
  "Peru": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Ica", "Huancayo", "Tacna", "Pucallpa", "Iquitos", "Cajamarca", "Ayacucho", "Chimbote"],
  "Colombia": ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales"],
  "Chile": ["Santiago", "Valparaiso", "Concepcion", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Iquique", "Puerto Montt"],
  "Mexico": ["Ciudad de Mexico", "Guadalajara", "Monterrey", "Puebla", "Cancun", "Merida", "Queretaro", "Leon", "Tijuana"],
  "Argentina": ["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "Tucuman", "La Plata", "Mar del Plata", "Salta", "Neuquen"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Ambato", "Machala", "Manta", "Loja"],
  "Bolivia": ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Tarija"],
  "Uruguay": ["Montevideo", "Punta del Este", "Salto", "Maldonado"],
  "Paraguay": ["Asuncion", "Ciudad del Este", "Encarnacion"],
  "Espana": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Malaga", "Bilbao", "Zaragoza", "Alicante", "Palma de Mallorca"],
};

const SURFACE_OPTIONS = ["Césped sintético", "Cristal", "Moqueta", "Hormigón"];

const SPORT_OPTIONS = [
  { value: "padel",      label: "Pádel",       emoji: "🎾" },
  { value: "padbol",     label: "Pádbol",      emoji: "🏓" },
  { value: "tenis",      label: "Tenis",       emoji: "🎾" },
  { value: "pickleball", label: "Pickleball",  emoji: "🏸" },
  { value: "squash",     label: "Squash",      emoji: "🟡" },
  { value: "frontenis",  label: "Frontenis",   emoji: "🏟️" },
  { value: "futbol",     label: "Fútbol",      emoji: "⚽" },
  { value: "futsal",     label: "Fútbol sala", emoji: "🥅" },
  { value: "basket",     label: "Básquet",     emoji: "🏀" },
  { value: "voley",      label: "Vóley",       emoji: "🏐" },
  { value: "natacion",   label: "Natación",    emoji: "🏊" },
  { value: "otro",       label: "Otro",        emoji: "🏅" },
];

const PRESET_COLORS = [
  { label: "Azul clásico", primary: "#1e3a8a", accent: "#3b82f6" },
  { label: "Verde esmeralda", primary: "#065f46", accent: "#10b981" },
  { label: "Naranja fuego", primary: "#7c2d12", accent: "#f97316" },
  { label: "Morado real", primary: "#581c87", accent: "#a855f7" },
  { label: "Rojo granate", primary: "#7f1d1d", accent: "#ef4444" },
  { label: "Gris moderno", primary: "#1f2937", accent: "#6b7280" },
];

let _courtId = 0;
function newCourt(idx: number): CourtData {
  _courtId += 1;
  return { id: `c-${_courtId}`, name: `Cancha ${idx + 1}`, sport: "padel", type: "outdoor", surface: "Césped sintético" };
}

let _sedeId = 0;
function newSede(idx: number): SedeData {
  _sedeId += 1;
  return { id: `s-${_sedeId}`, name: idx === 0 ? "Sede principal" : `Sede ${idx + 1}`, address: "" };
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setBranding = useBrandingStore((s) => s.setBranding);

  const [step, setStep] = useState(0);
  const [launched, setLaunched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [account, setAccount] = useState<AccountData>({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [club, setClub] = useState<ClubData>({
    name: "", country: "", city: "", address: "", phone: "", sports: ["padel"],
  });
  const [sedes, setSedes] = useState<SedeData[]>([newSede(0)]);
  const [plan, setPlan] = useState<PlanChoice>("starter");
  const [courts, setCourts] = useState<CourtData[]>([newCourt(0)]);
  const [branding, setBrandingLocal] = useState<BrandingData>({
    primaryColor: "#1e3a8a", accentColor: "#3b82f6", clubName: "", logoUrl: null,
  });
  const [scheduleName, setScheduleName] = useState("Horario principal");
  const [scheduleSlotDuration, setScheduleSlotDuration] = useState(60);
  const [scheduleDays, setScheduleDays] = useState<ScheduleDaySetup[]>(DEFAULT_SCHEDULE_DAYS);

  // Sync club name → branding name
  function updateClub(field: keyof Omit<ClubData, "sports">, value: string) {
    const updated = { ...club, [field]: value };
    setClub(updated);
    if (field === "name") setBrandingLocal((b) => ({ ...b, clubName: value }));
  }

  function toggleSport(value: string) {
    setClub((prev) => ({
      ...prev,
      sports: prev.sports.includes(value)
        ? prev.sports.length > 1 ? prev.sports.filter((s) => s !== value) : prev.sports
        : [...prev.sports, value],
    }));
  }

  function addSede() { setSedes((prev) => [...prev, newSede(prev.length)]); }
  function removeSede(id: string) { if (sedes.length > 1) setSedes((prev) => prev.filter((s) => s.id !== id)); }
  function updateSede(id: string, field: keyof Omit<SedeData, "id">, value: string) {
    setSedes((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  const errors = {
    account: [
      !account.firstName.trim() && "Ingresa tu nombre",
      !account.lastName.trim() && "Ingresa tu apellido",
      !account.email.trim() && "Ingresa tu correo",
      account.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) && "Correo inválido",
      !account.password && "Ingresa una contraseña",
      account.password && account.password.length < 8 && "Mínimo 8 caracteres",
      account.password && account.confirmPassword && account.password !== account.confirmPassword && "Las contraseñas no coinciden",
    ].filter(Boolean) as string[],
    club: [
      !club.name.trim() && "Ingresa el nombre del club",
      !club.country && "Selecciona un pais",
      !club.city && "Selecciona una ciudad",
      sedes.some((s) => !s.name.trim()) && "Todas las sedes necesitan nombre",
    ].filter(Boolean) as string[],
    courts: courts.some((c) => !c.name.trim()) ? ["Todas las canchas deben tener nombre"] : [],
  };

  const canAdvance =
    step === 0 ? errors.account.length === 0 && !!account.password && !!account.email :
    step === 1 ? errors.club.length === 0 :
    step === 2 ? errors.courts.length === 0 :
    step === 3 ? !!scheduleName.trim() :
    true;

  // ── Actions ──────────────────────────────────────────────────────────────────

  function next() { if (step < 6) setStep(step + 1); }
  function prev() { if (step > 0) setStep(step - 1); }

  function handleFinish() {
    setLaunched(true);
    setLoading(true);
    // Simulate account creation delay
    setTimeout(() => {
      // Apply branding to the store
      setBranding({
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        logoUrl: null,
        clubName: branding.clubName || club.name,
      });
      // Log in as super_admin (simulating new account)
      login("super_admin");
      navigate("/");
    }, 1200);
  }

  // ── Court helpers ─────────────────────────────────────────────────────────────

  function addCourt() { setCourts([...courts, newCourt(courts.length)]); }
  function removeCourt(id: string) { if (courts.length > 1) setCourts(courts.filter((c) => c.id !== id)); }
  function updateCourt(id: string, field: keyof CourtData, value: string) {
    setCourts(courts.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  // ── Step renderers ────────────────────────────────────────────────────────────

  function renderAccount() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Crea tu cuenta</h2>
          <p className="text-sm text-gray-500 mt-1">Serás el administrador principal del club.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={account.firstName}
              onChange={(e) => setAccount({ ...account, firstName: e.target.value })}
              placeholder="Carlos"
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
            <input
              type="text"
              value={account.lastName}
              onChange={(e) => setAccount({ ...account, lastName: e.target.value })}
              placeholder="Mendoza"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
          <input
            type="email"
            value={account.email}
            onChange={(e) => setAccount({ ...account, email: e.target.value })}
            placeholder="tu@correo.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono (opcional)</label>
          <PhoneInput
            value={account.phone}
            onChange={(v) => setAccount({ ...account, phone: v })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={account.password}
              onChange={(e) => setAccount({ ...account, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {account.password && (
            <div className="mt-1.5 flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < (account.password.length >= 12 ? 4 : account.password.length >= 10 ? 3 : account.password.length >= 8 ? 2 : 1)
                      ? account.password.length >= 12 ? "bg-emerald-500" : account.password.length >= 10 ? "bg-blue-500" : "bg-amber-400"
                      : "bg-gray-200"
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-1 whitespace-nowrap">
                {account.password.length >= 12 ? "Muy segura" : account.password.length >= 10 ? "Buena" : account.password.length >= 8 ? "Mínima" : "Corta"}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={account.confirmPassword}
              onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })}
              placeholder="Repite tu contraseña"
              className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                account.confirmPassword && account.password !== account.confirmPassword
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {account.confirmPassword && account.password !== account.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>
      </div>
    );
  }

  function renderClub() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cuéntanos sobre tu club</h2>
          <p className="text-sm text-gray-500 mt-1">Esta información aparecerá en tu panel y en el acceso de tus socios.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del club</label>
          <input
            type="text"
            value={club.name}
            onChange={(e) => updateClub("name", e.target.value)}
            placeholder="Ej: Ica Padel Club"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
            <select
              value={club.country}
              onChange={(e) => {
                const country = e.target.value;
                setClub({ ...club, country, city: "" });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {Object.keys(COUNTRIES_CITIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
            <select
              value={club.city}
              onChange={(e) => updateClub("city", e.target.value)}
              disabled={!club.country}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">{club.country ? "Seleccionar..." : "Elige país primero"}</option>
              {club.country && COUNTRIES_CITIES[club.country]?.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono del club</label>
            <PhoneInput
              value={club.phone}
              onChange={(v) => updateClub("phone", v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dirección (opcional)</label>
            <input
              type="text"
              value={club.address}
              onChange={(e) => updateClub("address", e.target.value)}
              placeholder="Av. Los Deportes 123"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Deportes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Deportes <span className="text-gray-400 font-normal">(selecciona todos los que apliquen)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORT_OPTIONS.map((s) => {
              const selected = club.sports.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSport(s.value)}
                  className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                    selected
                      ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm leading-none">{s.emoji}</span>
                  {s.label}
                  {selected && <Check className="w-3 h-3 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sedes */}
        <div className="border-t border-gray-100 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Sedes</h3>
            </div>
            <button
              onClick={addSede}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar sede
            </button>
          </div>
          <p className="text-xs text-gray-400">Cada club necesita al menos una sede. Puedes agregar más después.</p>

          <div className="space-y-3">
            {sedes.map((sede, idx) => (
              <div key={sede.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {idx === 0 ? "Sede principal" : sede.name || `Sede ${idx + 1}`}
                    </span>
                  </div>
                  {sedes.length > 1 && (
                    <button
                      onClick={() => removeSede(sede.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Nombre</label>
                    <input
                      type="text"
                      value={sede.name}
                      onChange={(e) => updateSede(sede.id, "name", e.target.value)}
                      placeholder={idx === 0 ? "Sede principal" : `Sede ${idx + 1}`}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Dirección</label>
                    <input
                      type="text"
                      value={sede.address}
                      onChange={(e) => updateSede(sede.id, "address", e.target.value)}
                      placeholder="Av. Los Deportes 123"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderCourts() {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agrega tus canchas</h2>
            <p className="text-sm text-gray-500 mt-1">Puedes modificarlas después desde el panel.</p>
          </div>
          <button
            onClick={addCourt}
            className="shrink-0 flex items-center gap-1.5 bg-blue-800 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {courts.map((court, idx) => (
            <div
              key={court.id}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Nombre</label>
                <input
                  type="text"
                  value={court.name}
                  onChange={(e) => updateCourt(court.id, "name", e.target.value)}
                  placeholder={`Cancha ${idx + 1}`}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Deporte</label>
                <select
                  value={court.sport}
                  onChange={(e) => updateCourt(court.id, "sport", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SPORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Tipo</label>
                <select
                  value={court.type}
                  onChange={(e) => updateCourt(court.id, "type", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                  <option value="covered">Techada</option>
                </select>
              </div>
              <div className="w-40">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Superficie</label>
                <select
                  value={court.surface}
                  onChange={(e) => updateCourt(court.id, "surface", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SURFACE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={() => removeCourt(court.id)}
                disabled={courts.length === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium">¿Tienes varias sedes?</p>
          <p className="text-blue-600 text-xs mt-0.5">Puedes agregar sedes y organizar las canchas por sede desde el panel de administración.</p>
        </div>
      </div>
    );
  }

  function renderSchedule() {
    function updateScheduleDay(dayOfWeek: number, patch: Partial<ScheduleDaySetup>) {
      setScheduleDays((prev) =>
        prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configura tu horario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define cuándo están abiertas tus canchas y el precio base por bloque.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del horario</label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Horario principal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duración del bloque</label>
            <select
              value={scheduleSlotDuration}
              onChange={(e) => setScheduleSlotDuration(+e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30 minutos</option>
            </select>
          </div>
        </div>

        {/* Day table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-16">Día</th>
                <th className="text-center px-2 py-2.5 font-medium text-gray-500 w-16">Abierto</th>
                <th className="text-left px-2 py-2.5 font-medium text-gray-500">Apertura</th>
                <th className="text-left px-2 py-2.5 font-medium text-gray-500">Cierre</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Precio (cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scheduleDays.map((day) => (
                <tr key={day.dayOfWeek} className={day.isClosed ? "opacity-40" : ""}>
                  <td className="px-4 py-2 font-medium text-gray-700 text-xs">
                    {DAY_NAMES_SHORT[day.dayOfWeek]}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { isClosed: !e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      value={day.openTime}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { openTime: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      value={day.closeTime}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { closeTime: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={day.pricePerSlot}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { pricePerSlot: +e.target.value })}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs text-right disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Este es un precio base por bloque. Podrás crear rangos de precio más detallados (mañana, tarde, noche) después en la sección de Horarios.
        </p>
      </div>
    );
  }

  function renderBranding() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      setBrandingLocal({ ...branding, logoUrl: url });
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Personaliza tu marca</h2>
          <p className="text-sm text-gray-500 mt-1">Los colores se aplican al panel de tus socios. Siempre puedes cambiarlo.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre visible del club</label>
          <input
            type="text"
            value={branding.clubName}
            onChange={(e) => setBrandingLocal({ ...branding, clubName: e.target.value })}
            placeholder={club.name || "Mi Club de Pádel"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Logo del club</label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
              {logoPreview || branding.logoUrl ? (
                <img src={logoPreview || branding.logoUrl!} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <PadelIcon className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {(logoPreview || branding.logoUrl) && (
                <button
                  onClick={() => { setLogoPreview(null); setBrandingLocal({ ...branding, logoUrl: null }); }}
                  className="text-xs text-gray-400 hover:text-red-500 ml-2"
                >
                  Quitar
                </button>
              )}
              <p className="text-[11px] text-gray-400">PNG, JPG o SVG. Recomendado: 200x200px.</p>
            </div>
          </div>
        </div>

        {/* Color palette */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Paleta de colores</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_COLORS.map((preset) => {
              const isSelected = branding.primaryColor === preset.primary && branding.accentColor === preset.accent;
              return (
                <button
                  key={preset.label}
                  onClick={() => setBrandingLocal({ ...branding, primaryColor: preset.primary, accentColor: preset.accent })}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex gap-1 shrink-0">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-xs text-gray-700 font-medium flex-1">{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-gray-500">O elige manualmente:</label>
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBrandingLocal({ ...branding, primaryColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              title="Color primario"
            />
            <input
              type="color"
              value={branding.accentColor}
              onChange={(e) => setBrandingLocal({ ...branding, accentColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              title="Color acento"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vista previa — app del socio</p>
          </div>
          <div className="p-4" style={{ backgroundColor: branding.primaryColor }}>
            <div className="flex items-center gap-3 mb-3">
              {logoPreview || branding.logoUrl ? (
                <img src={logoPreview || branding.logoUrl!} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <PadelIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-white text-sm">{branding.clubName || club.name || "Mi Club"}</p>
                <p className="text-[10px]" style={{ color: branding.accentColor }}>Panel del socio</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div
                className="flex-1 text-center text-xs font-semibold py-2 rounded-lg text-white"
                style={{ backgroundColor: branding.accentColor }}
              >
                Reservar
              </div>
              <div className="flex-1 text-center text-xs font-semibold py-2 rounded-lg text-white bg-white/20">
                Mi saldo
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPlan() {
    const courtCount = courts.length;
    const starterExceeded = courtCount > 4;

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Elige tu plan</h2>
          <p className="text-sm text-gray-500 mt-1">Empieza gratis y escala cuando quieras. Sin contratos ni permanencia.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS_DATA.map((p) => {
            const selected = plan === p.id;
            const isStarterBlocked = p.id === "starter" && starterExceeded;
            return (
              <button
                key={p.id}
                onClick={() => !isStarterBlocked && setPlan(p.id)}
                className={`text-left rounded-xl border-2 p-5 transition-all relative ${
                  isStarterBlocked
                    ? "border-gray-200 opacity-60 cursor-not-allowed"
                    : selected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
                  {selected && !isStarterBlocked && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  {p.popular && !selected && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Popular</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{p.price}</p>
                <p className="text-xs text-gray-500 mt-0.5">+ {p.fee}</p>

                {/* Court limit highlight */}
                <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
                  isStarterBlocked
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  {p.courts}
                  {isStarterBlocked && <span className="ml-auto text-[10px]">(tienes {courtCount})</span>}
                </div>

                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {starterExceeded && plan === "starter" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Tienes {courtCount} canchas configuradas. El plan Starter permite hasta 4. Selecciona Pro o Business para continuar.
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          <p className="font-medium">14 días de prueba en cualquier plan</p>
          <p className="text-blue-600 mt-0.5">Prueba todas las funciones sin compromiso. Puedes cambiar de plan en cualquier momento.</p>
        </div>
      </div>
    );
  }

  function renderSuccess() {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Animated success icon */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${branding.primaryColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: branding.primaryColor }} />
          </div>
          {/* Confetti dots */}
          <span className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
          <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-blue-400 animate-ping [animation-delay:200ms]" />
          <span className="absolute bottom-0 -left-3 w-2 h-2 rounded-full bg-pink-400 animate-ping [animation-delay:400ms]" />
          <span className="absolute -bottom-1 -right-2 w-3 h-3 rounded-full bg-purple-400 animate-ping [animation-delay:300ms]" />
          <span className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-emerald-400 animate-ping [animation-delay:100ms]" />
          <span className="absolute top-1/2 -left-5 w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping [animation-delay:500ms]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">¡Todo listo!</h2>
          <p className="text-gray-500 max-w-sm">
            Tu club{" "}
            <span className="font-semibold text-gray-800">{branding.clubName || club.name}</span>{" "}
            está configurado. Empieza a gestionar reservas ahora.
          </p>
        </div>

        {/* Summary cards */}
        <div className="w-full space-y-2 text-left">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{account.firstName} {account.lastName}</p>
              <p className="text-xs text-gray-400">{account.email}</p>
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{branding.clubName || club.name} · {club.city}, {club.country}</p>
              <p className="text-xs text-gray-400">{sedes.length} sede{sedes.length !== 1 ? "s" : ""} · {courts.length} cancha{courts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Plan {PLANS_DATA.find((p) => p.id === plan)?.name}</p>
              <p className="text-xs text-gray-400">{PLANS_DATA.find((p) => p.id === plan)?.price} + {PLANS_DATA.find((p) => p.id === plan)?.fee}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: branding.accentColor }} />
              <p className="text-sm text-gray-600">Marca configurada</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm transition-all disabled:opacity-70"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Ir al dashboard <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    );
  }

  const stepContent = [renderAccount, renderClub, renderCourts, renderSchedule, renderBranding, renderPlan, renderSuccess];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] shrink-0 flex-col justify-between bg-gradient-to-br from-[#0c1e3d] via-[#122d5a] to-[#0c1e3d] p-10 xl:p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <PadelIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CanchaPro</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Registra tu club en minutos
          </h2>
          <p className="max-w-sm text-lg text-blue-200/80">
            Configura canchas, horarios, precios y marca. Tu club listo para recibir reservas hoy.
          </p>

          {/* Step nav on sidebar */}
          {!launched && (
            <div className="space-y-1 pt-4">
              {STEPS.filter((_, i) => i < STEPS.length - 1).map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <button
                    key={s.id}
                    onClick={() => done && setStep(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                      active
                        ? "bg-white/15 text-white font-semibold"
                        : done
                          ? "text-emerald-300 cursor-pointer hover:bg-white/5"
                          : "text-white/25"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-white/20 text-white" : "bg-white/5 text-white/25"
                    }`}>
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-sm text-white/30">
          Hecho por Lumini &middot; lumini.dev
        </p>
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden bg-gradient-to-r from-[#0c1e3d] to-[#1e3a5f] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <PadelIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Registra tu club</p>
              <p className="text-blue-200/60 text-[11px]">
                {step < STEPS.length - 1 ? `Paso ${step + 1} de ${STEPS.length - 1}` : "¡Todo listo!"}
              </p>
            </div>
          </div>
          {!launched && (
            <button onClick={() => navigate("/login")} className="text-white/40 hover:text-white/80 transition-colors text-lg">
              ✕
            </button>
          )}
        </div>

        {/* Progress bar — mobile only */}
        {!launched && (
          <div className="h-1 bg-gray-200 lg:hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-lg mx-auto lg:mx-0">
            {stepContent[step]()}
          </div>
        </div>

        {/* Footer navigation */}
        {step < STEPS.length - 1 && !launched && (
          <div className="border-t border-gray-200 bg-white px-5 py-4 sm:px-8 lg:px-12 xl:px-16 shrink-0">
            <div className="max-w-lg mx-auto lg:mx-0 flex items-center justify-between">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
                >
                  Ya tengo cuenta
                </Link>
                <button
                  onClick={next}
                  disabled={!canAdvance}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-800 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {step === STEPS.length - 2 ? "Ver resumen" : "Continuar"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
