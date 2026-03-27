import { useState } from "react";
import { useBrandingStore } from "@/store/brandingStore";
import { Palette, RotateCcw, Upload, X, Check, CalendarDays, CreditCard, ChevronRight, Star, Clock } from "lucide-react";
import PadelIcon from "@/components/PadelIcon";

const PRESET_COLORS = [
  { label: "Azul clasico", primary: "#1e3a8a", accent: "#3b82f6" },
  { label: "Verde esmeralda", primary: "#065f46", accent: "#10b981" },
  { label: "Naranja fuego", primary: "#7c2d12", accent: "#f97316" },
  { label: "Morado real", primary: "#581c87", accent: "#a855f7" },
  { label: "Rojo granate", primary: "#7f1d1d", accent: "#ef4444" },
  { label: "Gris moderno", primary: "#1f2937", accent: "#6b7280" },
];

export default function BrandingPage() {
  const { branding, setBranding } = useBrandingStore();
  const [form, setForm] = useState({ ...branding });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setBranding(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    const defaults = { primaryColor: "#1e3a8a", accentColor: "#3b82f6", logoUrl: null as string | null, clubName: "Ica Padel Club" };
    setForm(defaults);
    setBranding(defaults);
  }

  function handleLogoUpload() {
    // In a real app this would open a file picker and upload
    // For the demo, cycle through some mock URLs
    const mockLogos = [
      "https://api.dicebear.com/9.x/initials/svg?seed=IPC&backgroundColor=1e3a8a&textColor=ffffff",
      "https://api.dicebear.com/9.x/initials/svg?seed=LP&backgroundColor=065f46&textColor=ffffff",
      null,
    ];
    const currentIdx = mockLogos.indexOf(form.logoUrl);
    const next = mockLogos[(currentIdx + 1) % mockLogos.length];
    setForm({ ...form, logoUrl: next });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marca del club</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personaliza los colores y el logo de tu club. Los cambios se reflejan en el sidebar y toda la interfaz.
        </p>
      </div>

      {/* Live preview — member UI mockup */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Vista previa del socio</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Así ven la app tus socios</span>
        </div>
        <div className="p-5">
          {/* Phone-style mockup */}
          <div className="mx-auto max-w-sm rounded-2xl overflow-hidden border border-gray-200 shadow-md">
            {/* Sidebar header */}
            <div
              className="px-4 pt-4 pb-3 flex items-center gap-3"
              style={{ backgroundColor: form.primaryColor }}
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-7 h-7 rounded" />
                ) : (
                  <PadelIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{form.clubName || "Mi Club"}</p>
                <p className="text-[10px]" style={{ color: form.accentColor }}>Carlos Mendoza · Socio</p>
              </div>
            </div>

            {/* Balance card */}
            <div
              className="mx-3 mt-3 rounded-xl p-4"
              style={{ background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.primaryColor}cc 100%)` }}
            >
              <p className="text-[10px] text-white/70 uppercase tracking-wide">Saldo disponible</p>
              <p className="text-2xl font-bold text-white mt-0.5">240 <span className="text-sm font-normal text-white/80">créditos</span></p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-center"
                  style={{ backgroundColor: form.accentColor, color: "#fff" }}
                >
                  Recargar
                </button>
                <button className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-center bg-white/20 text-white">
                  Historial
                </button>
              </div>
            </div>

            {/* Quick action */}
            <div className="mx-3 mt-3">
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: form.primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Reservar cancha
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </div>

            {/* Upcoming bookings */}
            <div className="mx-3 mt-3 mb-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximas reservas</p>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${form.primaryColor}20` }}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: form.primaryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Cancha 1 · Viernes</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> 19:00 – 20:00
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${form.accentColor}20`, color: form.accentColor }}
                    >
                      Confirmada
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${form.primaryColor}20` }}
                  >
                    <CreditCard className="w-3.5 h-3.5" style={{ color: form.primaryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Cancha 2 · Sábado</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> 10:00 – 11:00
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${form.accentColor}20`, color: form.accentColor }}
                    >
                      Confirmada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Configuracion</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Club name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del club</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.clubName}
              onChange={(e) => setForm({ ...form, clubName: e.target.value })}
              placeholder="Mi Club de Padel"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 border-dashed border-gray-300"
                style={{ backgroundColor: form.logoUrl ? "transparent" : form.primaryColor }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg" />
                ) : (
                  <PadelIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLogoUpload}
                  className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {form.logoUrl ? "Cambiar" : "Subir logo"}
                </button>
                {form.logoUrl && (
                  <button
                    onClick={() => setForm({ ...form, logoUrl: null })}
                    className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paleta de colores</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = form.primaryColor === preset.primary && form.accentColor === preset.accent;
                return (
                  <button
                    key={preset.label}
                    onClick={() => setForm({ ...form, primaryColor: preset.primary, accentColor: preset.accent })}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-1 shrink-0">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de acento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Palette className="w-4 h-4" />
          Guardar cambios
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-in fade-in-0">
            <Check className="w-4 h-4" />
            Guardado
          </span>
        )}
      </div>
    </div>
  );
}
