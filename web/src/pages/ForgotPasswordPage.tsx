import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Mail, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import PadelIcon from "@/components/PadelIcon";
import { findUserByEmail } from "@/lib/mock-data";
import type { Role } from "@/lib/mock-data";

type Step = "email" | "method" | "code" | "password" | "success";

function resolveUser(email: string): { role: Role; name: string } | null {
  const cred = findUserByEmail(email);
  if (!cred) return null;
  return { role: cred.user.role, name: cred.user.name };
}

interface RecoveryMethod {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
}

function getMethodsForRole(role: Role): RecoveryMethod[] {
  const emailMethod: RecoveryMethod = { id: "email", label: "Correo electronico", desc: "Enviar codigo al correo registrado", icon: Mail };
  const whatsapp: RecoveryMethod = { id: "whatsapp", label: "WhatsApp", desc: "Enviar codigo por WhatsApp", icon: MessageSquare };
  const sms: RecoveryMethod = { id: "sms", label: "SMS", desc: "Enviar codigo por mensaje de texto", icon: Phone };
  const admin: RecoveryMethod = { id: "admin", label: "Contactar administrador", desc: "Solicitar restablecimiento manual", icon: ShieldCheck };

  if (role === "super_admin") return [emailMethod];
  if (role === "staff") return [emailMethod, admin];
  return [emailMethod, whatsapp, sms];
}

const MOCK_CODE = "123456";

const INPUT_CLASS =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState<{ role: Role; name: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [sending, setSending] = useState(false);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const user = resolveUser(email.trim().toLowerCase());
    if (!user) {
      setError("No se encontro una cuenta con ese correo.");
      return;
    }
    setResolved(user);
    setStep("method");
  }

  function handleMethodSelect(methodId: string) {
    setSelectedMethod(methodId);
    if (methodId === "admin") {
      setStep("success");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("code");
    }, 1200);
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    if (code !== MOCK_CODE) {
      setCodeError("Codigo incorrecto. Revisa tu correo e intenta de nuevo.");
      return;
    }
    setStep("password");
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (password.length < 6) {
      setPwError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setPwError("Las contrasenas no coinciden.");
      return;
    }
    setStep("success");
  }

  const roleLabel =
    resolved?.role === "super_admin"
      ? "Administrador"
      : resolved?.role === "staff"
        ? "Staff"
        : "Socio";

  const stepTitles: Record<Step, string> = {
    email: "Recuperar contrasena",
    method: "Metodo de verificacion",
    code: "Verificar identidad",
    password: "Nueva contrasena",
    success: "Listo",
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="lg:min-h-screen lg:w-1/2 xl:w-[55%]">
        <div className="flex min-h-full flex-col justify-between bg-gradient-to-br from-[#0c1e3d] via-[#122d5a] to-[#0c1e3d] p-10 lg:p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <PadelIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Ica Padel Club</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              {stepTitles[step]}
            </h2>
            <p className="max-w-md text-lg text-blue-200/90">
              {step === "email" && "Ingresa tu correo y te ayudaremos a recuperar el acceso a tu cuenta."}
              {step === "method" && "Elige como quieres recibir tu codigo de verificacion."}
              {step === "code" && "Ingresa el codigo que te enviamos para verificar tu identidad."}
              {step === "password" && "Elige una nueva contrasena segura para tu cuenta."}
              {step === "success" && "Tu cuenta esta lista. Ya puedes volver a iniciar sesion."}
            </p>
          </div>
          <p className="text-sm text-white/40">
            Demo &middot; Lumini &middot; lumini.dev
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 lg:px-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 shadow-lg shadow-gray-200/50">
          {/* ═══ STEP 1: EMAIL ═══ */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Ingresa tu correo
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Te enviaremos un codigo para restablecer tu contrasena.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@correo.com"
                  className={INPUT_CLASS}
                />
                {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-100 p-3 space-y-1">
                <p className="font-medium text-gray-500">Correos de prueba:</p>
                <p>Plataforma: admin@lumini.dev</p>
                <p>Admin Ica: admin@icapc.com</p>
                <p>Socio Ica: socio@icapc.com</p>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
              >
                Continuar
              </button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesion
              </Link>
            </form>
          )}

          {/* ═══ STEP 2: METHOD ═══ */}
          {step === "method" && resolved && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Elige un metodo
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Hola <span className="font-medium text-gray-900">{resolved.name}</span>{" "}
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{roleLabel}</span>
                </p>
              </div>

              <div className="space-y-2">
                {getMethodsForRole(resolved.role).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    disabled={sending}
                    className="w-full flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm transition-all group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                      <method.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-700 transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {sending && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Enviando codigo...
                </div>
              )}

              <button
                onClick={() => setStep("email")}
                className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar correo
              </button>
            </div>
          )}

          {/* ═══ STEP 3: CODE ═══ */}
          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Ingresa el codigo
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Enviamos un codigo de 6 digitos
                  {selectedMethod === "email" && " a tu correo"}
                  {selectedMethod === "whatsapp" && " por WhatsApp"}
                  {selectedMethod === "sms" && " por SMS"}.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de verificacion</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setCodeError(""); }}
                  placeholder="000000"
                  className={`${INPUT_CLASS} text-center tracking-[0.5em] font-mono text-lg`}
                />
                {codeError && <p className="text-red-500 text-xs mt-1.5">{codeError}</p>}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Para el demo, usa el codigo: <span className="font-mono font-medium text-gray-600">123456</span>
              </p>
              <button
                type="submit"
                disabled={code.length < 6}
                className="w-full bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                Verificar codigo
              </button>
              <button
                onClick={() => setStep("method")}
                type="button"
                className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Elegir otro metodo
              </button>
            </form>
          )}

          {/* ═══ STEP 4: NEW PASSWORD ═══ */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Nueva contrasena
                </h1>
                <p className="mt-1 text-sm text-gray-500">Ingresa tu nueva contrasena.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contrasena</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(""); }}
                  placeholder="Minimo 6 caracteres"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contrasena</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPwError(""); }}
                  placeholder="Repetir contrasena"
                  className={INPUT_CLASS}
                />
                {pwError && <p className="text-red-500 text-xs mt-1.5">{pwError}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
              >
                Restablecer contrasena
              </button>
            </form>
          )}

          {/* ═══ STEP 5: SUCCESS ═══ */}
          {step === "success" && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              {selectedMethod === "admin" ? (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Solicitud enviada</h1>
                  <p className="text-sm text-gray-500">
                    Se notifico al administrador. Te contactaran a <span className="font-medium text-gray-900">{email}</span> cuando tu contrasena sea restablecida.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Contrasena actualizada</h1>
                  <p className="text-sm text-gray-500">
                    Tu contrasena fue restablecida exitosamente. Ya puedes iniciar sesion.
                  </p>
                </>
              )}
              <Link
                to="/login"
                className="inline-block w-full bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
              >
                Ir a iniciar sesion
              </Link>
            </div>
          )}

          {/* Step indicator */}
          {step !== "success" && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {(["email", "method", "code", "password"] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? "w-6 bg-blue-600"
                      : i < ["email", "method", "code", "password"].indexOf(step)
                        ? "w-1.5 bg-blue-400"
                        : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
