import { useState } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Palette,
  Check,
  ChevronRight,
  ChevronLeft,
  Rocket,
} from "lucide-react";
interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  clubName: string;
}

// ── Local types for onboarding state ─────────────────────────────────────────

interface ClubInfo {
  name: string;
  city: string;
  slug: string;
  contactEmail: string;
}

interface OnboardingCourt {
  id: string;
  name: string;
  type: "indoor" | "outdoor" | "covered";
  surface: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

interface ScheduleDaySetup {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  pricePerSlot: number;
}

const STEPS = [
  "Datos del club",
  "Canchas",
  "Horario",
  "Marca",
  "Revisar y crear",
];

const SURFACE_OPTIONS = [
  "Cesped sintetico",
  "Cristal",
  "Moqueta",
  "Hormigon",
];

const PRESET_COLORS = [
  { label: "Azul clasico", primary: "#1e3a8a", accent: "#3b82f6" },
  { label: "Verde esmeralda", primary: "#065f46", accent: "#10b981" },
  { label: "Naranja fuego", primary: "#7c2d12", accent: "#f97316" },
  { label: "Morado real", primary: "#581c87", accent: "#a855f7" },
  { label: "Rojo granate", primary: "#7f1d1d", accent: "#ef4444" },
  { label: "Gris moderno", primary: "#1f2937", accent: "#6b7280" },
];

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const DEFAULT_SCHEDULE_DAYS: ScheduleDaySetup[] = [
  { dayOfWeek: 0, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 1, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 2, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 3, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 4, isClosed: false, openTime: "06:00", closeTime: "22:00", pricePerSlot: 1 },
  { dayOfWeek: 5, isClosed: false, openTime: "07:00", closeTime: "22:00", pricePerSlot: 1.5 },
  { dayOfWeek: 6, isClosed: false, openTime: "07:00", closeTime: "22:00", pricePerSlot: 1.5 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

let courtCounter = 0;
function newCourt(): OnboardingCourt {
  courtCounter += 1;
  return {
    id: `new-court-${courtCounter}`,
    name: "",
    type: "outdoor",
    surface: SURFACE_OPTIONS[0],
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [launched, setLaunched] = useState(false);

  // Step 1 — Club info
  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    name: "",
    city: "",
    slug: "",
    contactEmail: "",
  });

  // Step 2 — Courts
  const [courts, setCourts] = useState<OnboardingCourt[]>([newCourt()]);

  // Step 3 — Schedule
  const [scheduleName, setScheduleName] = useState("Horario principal");
  const [scheduleSlotDuration, setScheduleSlotDuration] = useState(60);
  const [scheduleDays, setScheduleDays] = useState<ScheduleDaySetup[]>(DEFAULT_SCHEDULE_DAYS);

  // Step 4 — Branding
  const [branding, setBranding] = useState<TenantBranding>({
    primaryColor: "#1e3a8a",
    accentColor: "#3b82f6",
    logoUrl: null,
    clubName: "",
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!(
          clubInfo.name.trim() &&
          clubInfo.city.trim() &&
          clubInfo.slug.trim() &&
          clubInfo.contactEmail.trim()
        );
      case 1:
        return courts.length > 0 && courts.every((c) => c.name.trim());
      case 2:
        return !!scheduleName.trim();
      case 3:
        return true;
      default:
        return true;
    }
  };

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  function handleLaunch() {
    setLaunched(true);
  }

  // ── Helpers for club info ──────────────────────────────────────────────────

  function updateClubInfo(field: keyof ClubInfo, value: string) {
    const updated = { ...clubInfo, [field]: value };
    if (field === "name") {
      updated.slug = slugify(value);
      setBranding((b) => ({ ...b, clubName: value }));
    }
    setClubInfo(updated);
  }

  // ── Helpers for courts ─────────────────────────────────────────────────────

  function addCourt() {
    setCourts([...courts, newCourt()]);
  }

  function removeCourt(id: string) {
    setCourts(courts.filter((c) => c.id !== id));
  }

  function updateCourt(id: string, field: keyof OnboardingCourt, value: string) {
    setCourts(
      courts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  // ── Helpers for schedule ───────────────────────────────────────────────────

  function updateScheduleDay(dayOfWeek: number, patch: Partial<ScheduleDaySetup>) {
    setScheduleDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
    );
  }

  // ── Render steps ───────────────────────────────────────────────────────────

  function renderClubInfo() {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Datos del club
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Ingresa la informacion basica de tu club de padel.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del club
            </label>
            <input
              type="text"
              value={clubInfo.name}
              onChange={(e) => updateClubInfo("name", e.target.value)}
              placeholder="Ica Padel Club"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              value={clubInfo.city}
              onChange={(e) => updateClubInfo("city", e.target.value)}
              placeholder="Ica"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">app.padel.pe/</span>
              <input
                type="text"
                value={clubInfo.slug}
                onChange={(e) => updateClubInfo("slug", e.target.value)}
                placeholder="ica-padel-club"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contacto
            </label>
            <input
              type="email"
              value={clubInfo.contactEmail}
              onChange={(e) => updateClubInfo("contactEmail", e.target.value)}
              placeholder="admin@icapadel.pe"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderCourts() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Canchas</h2>
          </div>
          <button
            onClick={addCourt}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Agregar cancha
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Define las canchas disponibles en tu club.
        </p>

        <div className="space-y-3">
          {courts.map((court, idx) => (
            <div
              key={court.id}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={court.name}
                  onChange={(e) => updateCourt(court.id, "name", e.target.value)}
                  placeholder={`Cancha ${idx + 1}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div className="w-36">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Tipo
                </label>
                <select
                  value={court.type}
                  onChange={(e) =>
                    updateCourt(
                      court.id,
                      "type",
                      e.target.value as OnboardingCourt["type"]
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="covered">Techada</option>
                </select>
              </div>

              <div className="w-40">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Superficie
                </label>
                <select
                  value={court.surface}
                  onChange={(e) =>
                    updateCourt(court.id, "surface", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                  {SURFACE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => removeCourt(court.id)}
                disabled={courts.length === 1}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSchedule() {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Horario de operación
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Define cuándo están abiertas las canchas y el precio base por bloque.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del horario</label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Ej. Horario principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración del bloque</label>
            <select
              value={scheduleSlotDuration}
              onChange={(e) => setScheduleSlotDuration(+e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30 minutos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-2 font-medium text-gray-600 w-16">Día</th>
                <th className="text-center py-2 pr-2 font-medium text-gray-600 w-16">Abierto</th>
                <th className="text-left py-2 pr-2 font-medium text-gray-600">Apertura</th>
                <th className="text-left py-2 pr-2 font-medium text-gray-600">Cierre</th>
                <th className="text-right py-2 font-medium text-gray-600">Precio (cr)</th>
              </tr>
            </thead>
            <tbody>
              {scheduleDays.map((day) => (
                <tr key={day.dayOfWeek} className={`border-b border-gray-100 ${day.isClosed ? "opacity-40" : ""}`}>
                  <td className="py-2 pr-2 font-medium text-gray-700 text-xs">
                    {DAY_NAMES[day.dayOfWeek]}
                  </td>
                  <td className="py-2 pr-2 text-center">
                    <input
                      type="checkbox"
                      checked={!day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { isClosed: !e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="time"
                      value={day.openTime}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { openTime: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs disabled:opacity-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="time"
                      value={day.closeTime}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { closeTime: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs disabled:opacity-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={day.pricePerSlot}
                      disabled={day.isClosed}
                      onChange={(e) => updateScheduleDay(day.dayOfWeek, { pricePerSlot: +e.target.value })}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs text-right disabled:opacity-40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-400">
          El admin del club podrá crear rangos de precio más detallados después.
        </p>
      </div>
    );
  }

  function renderBranding() {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Marca del club
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Elige un color primario y personaliza la identidad visual.
        </p>

        {/* Club name display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre visible
          </label>
          <input
            type="text"
            value={branding.clubName}
            onChange={(e) =>
              setBranding({ ...branding, clubName: e.target.value })
            }
            placeholder="Ica Padel Club"
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Color presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color primario
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_COLORS.map((preset) => {
              const isSelected =
                branding.primaryColor === preset.primary &&
                branding.accentColor === preset.accent;
              return (
                <button
                  key={preset.primary}
                  onClick={() =>
                    setBranding({
                      ...branding,
                      primaryColor: preset.primary,
                      accentColor: preset.accent,
                    })
                  }
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-1.5">
                    <span
                      className="block w-5 h-5 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="block w-5 h-5 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <span className="text-sm text-gray-700">{preset.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL del logo (opcional)
          </label>
          <input
            type="url"
            value={branding.logoUrl ?? ""}
            onChange={(e) =>
              setBranding({
                ...branding,
                logoUrl: e.target.value || null,
              })
            }
            placeholder="https://ejemplo.com/logo.png"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 mb-3">
            Vista previa
          </p>
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-white/80" />
            )}
            <span className="text-white font-semibold text-sm">
              {branding.clubName || clubInfo.name || "Mi Club"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function renderReview() {
    if (launched) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            {/* Confetti-style dots */}
            <span className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
            <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-blue-400 animate-ping [animation-delay:200ms]" />
            <span className="absolute bottom-0 -left-3 w-2 h-2 rounded-full bg-pink-400 animate-ping [animation-delay:400ms]" />
            <span className="absolute -bottom-1 -right-2 w-3 h-3 rounded-full bg-purple-400 animate-ping [animation-delay:300ms]" />
            <span className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-green-400 animate-ping [animation-delay:100ms]" />
            <span className="absolute top-1/2 -left-5 w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping [animation-delay:500ms]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Club creado exitosamente
          </h2>
          <p className="text-gray-500 max-w-sm">
            <span className="font-semibold text-gray-700">
              {clubInfo.name}
            </span>{" "}
            esta listo. Ya puedes configurar horarios, agregar socios y empezar
            a recibir reservas.
          </p>
        </div>
      );
    }

    const courtTypeLabel = (t: OnboardingCourt["type"]) =>
      t === "indoor" ? "Indoor" : t === "outdoor" ? "Outdoor" : "Techada";

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Revisar y crear club
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Verifica que toda la informacion sea correcta antes de crear el club.
        </p>

        {/* Club info summary */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Datos del club
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-500">Nombre</span>
            <span className="text-gray-900">{clubInfo.name}</span>
            <span className="text-gray-500">Ciudad</span>
            <span className="text-gray-900">{clubInfo.city}</span>
            <span className="text-gray-500">Slug</span>
            <span className="text-gray-900">/{clubInfo.slug}</span>
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{clubInfo.contactEmail}</span>
          </div>
        </div>

        {/* Courts summary */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Canchas ({courts.length})
          </h3>
          <div className="space-y-1">
            {courts.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-900 font-medium">{c.name}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-500">{courtTypeLabel(c.type)}</span>
                <span className="text-gray-400">-</span>
                <span className="text-gray-500">{c.surface}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule summary */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Horario: {scheduleName} (bloques de {scheduleSlotDuration} min)
          </h3>
          <div className="space-y-1 text-sm">
            {scheduleDays.map((d) => (
              <div key={d.dayOfWeek} className={`flex items-center gap-2 ${d.isClosed ? "opacity-40" : ""}`}>
                <span className="text-gray-500 w-8">{DAY_NAMES[d.dayOfWeek]}</span>
                {d.isClosed ? (
                  <span className="text-gray-400">Cerrado</span>
                ) : (
                  <>
                    <span className="text-gray-700">{d.openTime}–{d.closeTime}</span>
                    <span className="font-medium text-gray-900">{d.pricePerSlot} cr</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Branding summary */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Marca</h3>
          <div className="flex items-center gap-3">
            <span
              className="block w-6 h-6 rounded-full border border-gray-200"
              style={{ backgroundColor: branding.primaryColor }}
            />
            <span
              className="block w-6 h-6 rounded-full border border-gray-200"
              style={{ backgroundColor: branding.accentColor }}
            />
            <span className="text-sm text-gray-700">
              {branding.clubName || clubInfo.name}
            </span>
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-6 h-6 rounded-full object-cover ml-2"
              />
            )}
          </div>
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
        >
          <Rocket className="w-5 h-5" />
          Crear club
        </button>
      </div>
    );
  }

  // ── Step renderer map ──────────────────────────────────────────────────────

  const stepRenderers = [
    renderClubInfo,
    renderCourts,
    renderSchedule,
    renderBranding,
    renderReview,
  ];

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Configurar nuevo club
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Paso {step + 1} de {STEPS.length} &mdash; {STEPS[step]}
        </p>
      </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        {!launched && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {step < STEPS.length - 1 && (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => !launched && i <= step && setStep(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === step
                  ? "bg-blue-600 w-6"
                  : i < step
                  ? "bg-blue-300 w-2.5 cursor-pointer"
                  : "bg-gray-300 w-2.5"
              }`}
            />
          ))}
        </div>
    </div>
  );
}
