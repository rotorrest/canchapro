import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ADD_ONS_CATALOG, TENANT_ADD_ONS } from "@/lib/mock-data";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Gift,
  Globe,
  Handshake,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Save,
  ScanLine,
  Settings,
  Split,
  Star,
  Trophy,
  Users,
  CreditCard,
  GraduationCap,
  FileText,
  MapPin,
  Package,
} from "lucide-react";

// ── Icon map (same as MarketplacePage) ───────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  "message-circle": MessageCircle, "link": LinkIcon, "credit-card": CreditCard,
  "map-pin": MapPin, "mail": Mail, "trophy": Trophy, "users": Users,
  "scan-line": ScanLine, "package": Package, "clock": Clock,
  "graduation-cap": GraduationCap, "split": Split, "handshake": Handshake,
  "star": Star, "gift": Gift, "file-text": FileText, "globe": Globe,
};

function ModuleIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] ?? Settings;
  return <Icon className={className} />;
}

// ── Shared layout ────────────────────────────────────────────────────────────

function ConfigSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="flex justify-end">
      <button onClick={handleSave}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
        {saved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
      </button>
    </div>
  );
}

// ── Module configs ───────────────────────────────────────────────────────────

function WhatsAppConfig() {
  const [timing, setTiming] = useState<string[]>(["2h"]);
  const [template, setTemplate] = useState("Hola {nombre}, tu reserva en {cancha} es hoy a las {hora}. ¡Nos vemos en {club}!");
  const [phone, setPhone] = useState("+51 ");

  const toggleTiming = (t: string) => setTiming((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const TIMING_OPTIONS = [
    { value: "30m", label: "30 min antes" },
    { value: "1h", label: "1 hora antes" },
    { value: "2h", label: "2 horas antes" },
    { value: "4h", label: "4 horas antes" },
    { value: "24h", label: "1 día antes" },
  ];

  return (
    <div className="space-y-5">
      <ConfigSection title="Cuándo enviar" description="Selecciona cuándo enviar el recordatorio antes de la reserva.">
        <div className="flex flex-wrap gap-2">
          {TIMING_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => toggleTiming(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                timing.includes(opt.value) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {timing.includes(opt.value) && <Check className="w-3 h-3 inline mr-1" />}
              {opt.label}
            </button>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection title="Plantilla del mensaje" description="Usa {nombre}, {cancha}, {hora}, {fecha}, {club} como variables.">
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <div className="bg-emerald-50 rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Vista previa</p>
          <p className="text-sm text-emerald-900">
            {template.replace("{nombre}", "Pedro").replace("{cancha}", "Cancha 1").replace("{hora}", "18:00").replace("{fecha}", "27 mar").replace("{club}", "Ica Padel Club")}
          </p>
        </div>
      </ConfigSection>

      <ConfigSection title="Número de WhatsApp Business" description="El número desde el cual se enviarán los mensajes.">
        <TextInput value={phone} onChange={setPhone} placeholder="+51 999 999 999" />
        <p className="text-[11px] text-gray-400">Debe ser un número verificado en Meta Business API.</p>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function ListaEsperaConfig() {
  const [maxPerSlot, setMaxPerSlot] = useState("5");
  const [autoNotify, setAutoNotify] = useState(true);
  const [confirmWindow, setConfirmWindow] = useState("15");

  return (
    <div className="space-y-5">
      <ConfigSection title="Reglas de la lista" description="Define cómo funciona la lista de espera para cada slot.">
        <div>
          <FieldLabel label="Máximo de personas en lista por slot" />
          <TextInput value={maxPerSlot} onChange={setMaxPerSlot} type="number" placeholder="5" />
        </div>
        <Toggle checked={autoNotify} onChange={setAutoNotify} label="Notificar automáticamente al primero cuando se libere un slot" />
        <div>
          <FieldLabel label="Minutos para confirmar" hint="Si el socio no confirma en este tiempo, se pasa al siguiente." />
          <TextInput value={confirmWindow} onChange={setConfirmWindow} type="number" placeholder="15" />
        </div>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function LinkPagoConfig() {
  const [yape, setYape] = useState(true);
  const [plin, setPlin] = useState(true);
  const [culqi, setCulqi] = useState(false);
  const [defaultAmounts, setDefaultAmounts] = useState("50, 100, 200");

  return (
    <div className="space-y-5">
      <ConfigSection title="Proveedores habilitados" description="Selecciona qué métodos de pago pueden usar tus socios.">
        <div className="space-y-3">
          <Toggle checked={yape} onChange={setYape} label="Yape" />
          <Toggle checked={plin} onChange={setPlin} label="Plin" />
          <Toggle checked={culqi} onChange={setCulqi} label="Culqi (tarjeta de crédito/débito)" />
        </div>
      </ConfigSection>

      <ConfigSection title="Montos rápidos" description="Montos predefinidos para generar links de pago rápido.">
        <div>
          <FieldLabel label="Montos en Soles (separados por coma)" />
          <TextInput value={defaultAmounts} onChange={setDefaultAmounts} placeholder="50, 100, 200, 500" />
        </div>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function SplitCanchaConfig() {
  const [enabled, setEnabled] = useState(true);
  const [deadline, setDeadline] = useState("60");
  const [allowPartial, setAllowPartial] = useState(false);

  return (
    <div className="space-y-5">
      <ConfigSection title="Configuración del split">
        <Toggle checked={enabled} onChange={setEnabled} label="Permitir split de cancha" />
        <div>
          <FieldLabel label="Tiempo límite para que todos paguen (minutos)" hint="Después de este tiempo, la reserva se cancela automáticamente." />
          <TextInput value={deadline} onChange={setDeadline} type="number" placeholder="60" />
        </div>
        <Toggle checked={allowPartial} onChange={setAllowPartial} label="Permitir split parcial (no todos necesitan pagar)" />
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function ReferidosConfig() {
  const [creditReferrer, setCreditReferrer] = useState("5");
  const [creditReferred, setCreditReferred] = useState("3");
  const [maxReferrals, setMaxReferrals] = useState("20");
  const shareLink = "https://app.icapadelclub.pe/r/CLUB2026";

  return (
    <div className="space-y-5">
      <ConfigSection title="Incentivos" description="Define cuántos créditos reciben el referidor y el referido.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Créditos para quien refiere" />
            <TextInput value={creditReferrer} onChange={setCreditReferrer} type="number" />
          </div>
          <div>
            <FieldLabel label="Créditos para el referido" />
            <TextInput value={creditReferred} onChange={setCreditReferred} type="number" />
          </div>
        </div>
        <div>
          <FieldLabel label="Máximo de referidos por socio" hint="0 = sin límite" />
          <TextInput value={maxReferrals} onChange={setMaxReferrals} type="number" />
        </div>
      </ConfigSection>

      <ConfigSection title="Link de referidos" description="Este link es compartido por cada socio desde la app.">
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 truncate">{shareLink}</code>
          <button onClick={() => navigator.clipboard.writeText(shareLink)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400">Cada socio obtiene un link personalizado con su código único.</p>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function FidelizacionConfig() {
  const [pointsPerBooking, setPointsPerBooking] = useState("10");
  const [pointsRedemption, setPointsRedemption] = useState("100");
  const [creditsPerRedemption, setCreditsPerRedemption] = useState("1");
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [bonusThreshold, setBonusThreshold] = useState("10");
  const [bonusCredits, setBonusCredits] = useState("1");

  return (
    <div className="space-y-5">
      <ConfigSection title="Puntos por actividad" description="Define cuántos puntos gana un socio por cada acción.">
        <div>
          <FieldLabel label="Puntos por reserva completada" />
          <TextInput value={pointsPerBooking} onChange={setPointsPerBooking} type="number" />
        </div>
      </ConfigSection>

      <ConfigSection title="Redención" description="Define cuántos puntos se necesitan para canjear créditos.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Puntos necesarios" />
            <TextInput value={pointsRedemption} onChange={setPointsRedemption} type="number" />
          </div>
          <div>
            <FieldLabel label="Créditos que recibe" />
            <TextInput value={creditsPerRedemption} onChange={setCreditsPerRedemption} type="number" />
          </div>
        </div>
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Con esta config: cada {pointsRedemption} puntos = {creditsPerRedemption} crédito{+creditsPerRedemption > 1 ? "s" : ""}. A {pointsPerBooking} puntos/reserva, un socio necesita {Math.ceil(+pointsRedemption / (+pointsPerBooking || 1))} reservas para su primer canje.
        </p>
      </ConfigSection>

      <ConfigSection title="Bonus por racha" description="Recompensa automática cuando un socio juega X veces.">
        <Toggle checked={bonusEnabled} onChange={setBonusEnabled} label="Activar bonus por racha" />
        {bonusEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Después de X reservas" />
              <TextInput value={bonusThreshold} onChange={setBonusThreshold} type="number" />
            </div>
            <div>
              <FieldLabel label="Créditos de bonus" />
              <TextInput value={bonusCredits} onChange={setBonusCredits} type="number" />
            </div>
          </div>
        )}
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function ReportesSunatConfig() {
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoDefault, setTipoDefault] = useState<"boleta" | "factura">("boleta");

  return (
    <div className="space-y-5">
      <ConfigSection title="Datos fiscales" description="Estos datos aparecerán en los comprobantes electrónicos.">
        <div>
          <FieldLabel label="RUC" />
          <TextInput value={ruc} onChange={setRuc} placeholder="20XXXXXXXXX" />
        </div>
        <div>
          <FieldLabel label="Razón social" />
          <TextInput value={razonSocial} onChange={setRazonSocial} placeholder="Mi Club S.A.C." />
        </div>
        <div>
          <FieldLabel label="Dirección fiscal" />
          <TextInput value={direccion} onChange={setDireccion} placeholder="Av. Los Maestros 123, Ica" />
        </div>
      </ConfigSection>

      <ConfigSection title="Comprobante por defecto" description="Qué tipo de comprobante se genera al vender créditos.">
        <div className="flex gap-3">
          {(["boleta", "factura"] as const).map((t) => (
            <button key={t} onClick={() => setTipoDefault(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                tipoDefault === t ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {tipoDefault === t && <Check className="w-3 h-3 inline mr-1.5" />}
              {t}
            </button>
          ))}
        </div>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function RfidConfig() {
  const registered = 12;

  return (
    <div className="space-y-5">
      <ConfigSection title="Estado" description="Resumen del módulo RFID en tu club.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{registered}</p>
            <p className="text-[10px] text-gray-500">Tarjetas activas</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-[10px] text-gray-500">Packs pendientes</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">88</p>
            <p className="text-[10px] text-gray-500">Tarjetas restantes</p>
          </div>
        </div>
      </ConfigSection>

      <ConfigSection title="Pedir tarjetas" description="Las tarjetas se envían en packs de 100. Provee tu diseño y las fabricamos.">
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
          Envía tu diseño (logo + colores) a <strong>soporte@canchapro.com</strong> y te cotizamos el pack.
          Tiempo de entrega: 5-7 días hábiles.
        </div>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function ComunicacionesConfig() {
  const [senderName, setSenderName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="space-y-5">
      <ConfigSection title="Configuración de envío">
        <div>
          <FieldLabel label="Nombre del remitente" hint="El nombre que ven tus socios al recibir un email." />
          <TextInput value={senderName} onChange={setSenderName} placeholder="Ica Padel Club" />
        </div>
        <div>
          <FieldLabel label="Email de respuesta" hint="Si un socio responde al email, llega a esta dirección." />
          <TextInput value={replyEmail} onChange={setReplyEmail} placeholder="info@icapadelclub.pe" type="email" />
        </div>
        <Toggle checked={pushEnabled} onChange={setPushEnabled} label="Habilitar notificaciones push (requiere PWA)" />
      </ConfigSection>

      <ConfigSection title="Uso del mes">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">342 / 2,000 envíos</p>
            <p className="text-[11px] text-gray-400">Se reinicia el 1 de cada mes</p>
          </div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "17%" }} />
          </div>
        </div>
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function DominioConfig() {
  const [domain, setDomain] = useState("");

  return (
    <div className="space-y-5">
      <ConfigSection title="Dominio personalizado" description="Usa tu propio dominio para la app de tu club.">
        <div>
          <FieldLabel label="Tu dominio" hint="Ej: app.icapadelclub.pe" />
          <TextInput value={domain} onChange={setDomain} placeholder="app.tuclub.pe" />
        </div>
        {domain && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800">Configura este CNAME en tu DNS:</p>
            <code className="block bg-white rounded px-3 py-2 text-xs text-gray-700 font-mono">
              {domain} → icapadel.canchapro.com
            </code>
            <p className="text-[11px] text-amber-600">Una vez configurado, la verificación puede tomar hasta 24 horas.</p>
          </div>
        )}
      </ConfigSection>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function GenericConfig({ name }: { name: string }) {
  return (
    <div className="space-y-5">
      <ConfigSection title="Configuración" description={`La configuración de ${name} estará disponible próximamente.`}>
        <div className="text-center py-8">
          <Settings className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Este módulo está activo pero su panel de configuración está en desarrollo.</p>
          <p className="text-xs text-gray-400 mt-1">¿Necesitas ayuda? Contacta a soporte@canchapro.com</p>
        </div>
      </ConfigSection>
    </div>
  );
}

// ── Config router ────────────────────────────────────────────────────────────

const CONFIG_MAP: Record<string, React.ComponentType> = {
  ao1:  WhatsAppConfig,
  ao10: ListaEsperaConfig,
  ao2:  LinkPagoConfig,
  ao12: SplitCanchaConfig,
  ao8:  ReferidosConfig,
  ao15: FidelizacionConfig,
  ao16: ReportesSunatConfig,
  ao9:  RfidConfig,
  ao5:  ComunicacionesConfig,
  ao17: DominioConfig,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleConfigPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = useAuthStore((s) => s.tenantId);

  const addOn = ADD_ONS_CATALOG.find((a) => a.id === id);
  const isActive = TENANT_ADD_ONS.some((ta) => ta.tenantId === tenantId && ta.addOnId === id && !ta.cancelledAt);

  if (!addOn) {
    return (
      <div className="space-y-4">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Módulo no encontrado</p>
        </div>
      </div>
    );
  }

  const ConfigComponent = CONFIG_MAP[addOn.id] ?? (() => <GenericConfig name={addOn.name} />);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <ModuleIcon icon={addOn.icon} className="w-6 h-6 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{addOn.name}</h1>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Activo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{addOn.description}</p>
        </div>
      </div>

      {/* Config or not-active message */}
      {isActive ? (
        <ConfigComponent />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
          <ModuleIcon icon={addOn.icon} className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-700">Este módulo no está activo</p>
          <p className="text-xs text-gray-400">Actívalo desde el Marketplace para acceder a su configuración.</p>
          <Link to="/marketplace"
            className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Ir al Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
