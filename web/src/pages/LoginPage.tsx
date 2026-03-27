import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import { USER_DIRECTORY, getTenantById } from "@/lib/mock-data";
import { Eye, EyeOff, LogIn } from "lucide-react";
import PadelIcon from "@/components/PadelIcon";

const DEMO_ACCOUNTS = [
  { label: "Lumini (Plataforma)", email: "admin@lumini.dev" },
  { label: "Ica Padel — Admin", email: "admin@icapc.com" },
  { label: "Ica Padel — Staff", email: "staff@icapc.com" },
  { label: "Ica Padel — Socio", email: "socio@icapc.com" },
  { label: "Lima Padel — Admin", email: "admin@limacp.com" },
  { label: "Lima Padel — Staff", email: "staff@limacp.com" },
  { label: "Lima Padel — Socio", email: "socio@limacp.com" },
];

function LeftPanel() {
  return (
    <div className="flex min-h-full flex-col justify-between bg-gradient-to-br from-[#0c1e3d] via-[#122d5a] to-[#0c1e3d] p-10 lg:p-12 xl:p-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <PadelIcon className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white">CanchaPro</span>
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
          Tu club, bajo control total
        </h2>
        <p className="max-w-md text-lg text-blue-200/90">
          Gestiona reservas, creditos, socios y reportes desde un solo lugar.
        </p>
      </div>
      <p className="text-sm text-white/40">
        Hecho por Lumini &middot; lumini.dev
      </p>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const setBranding = useBrandingStore((s) => s.setBranding);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function applyTenantBranding(tenantId: string | null) {
    if (!tenantId) return;
    const tenant = getTenantById(tenantId);
    if (tenant) setBranding(tenant.branding);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) { setError("Ingresa tu contrasena."); return; }

    setLoading(true);
    setTimeout(() => {
      const result = loginWithCredentials(email, password);
      if (!result.success) {
        setError(result.error ?? "Error de autenticacion.");
        setLoading(false);
        return;
      }
      const cred = USER_DIRECTORY.find((c) => c.email === email.trim().toLowerCase());
      if (cred) applyTenantBranding(cred.tenantId);
      navigate("/");
    }, 500);
  }

  function handleQuickLogin(demoEmail: string) {
    setLoading(true);
    setTimeout(() => {
      const result = loginWithCredentials(demoEmail, "admin123");
      if (result.success) {
        const cred = USER_DIRECTORY.find((c) => c.email === demoEmail);
        if (cred) applyTenantBranding(cred.tenantId);
        navigate("/");
      }
      setLoading(false);
    }, 300);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:block lg:min-h-screen lg:w-1/2 xl:w-[55%]">
        <LeftPanel />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-[#0c1e3d] lg:bg-gray-50 px-5 py-10 lg:px-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-lg shadow-gray-200/50">
          <div className="space-y-6">
            {/* Mobile branding */}
            <div className="flex flex-col items-center gap-3 lg:hidden">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <PadelIcon className="w-8 h-8 text-blue-700" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">CanchaPro</h1>
                <p className="text-sm text-gray-500 mt-0.5">Inicia sesion en tu cuenta</p>
              </div>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Iniciar sesion</h1>
              <p className="mt-1 text-sm text-gray-500">Ingresa tus credenciales para acceder</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@correo.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Contrasena</label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Olvidaste tu contrasena?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Tu contrasena"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><LogIn className="w-4 h-4" /> Ingresar</>
                )}
              </button>
            </form>

            {/* Signup link */}
            <p className="text-center text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link to="/signup" className="text-blue-700 font-medium hover:text-blue-800 transition-colors">
                Registra tu club
              </Link>
            </p>

            {/* Demo quick access */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-400 text-center mb-3">Acceso rapido demo (contrasena: admin123)</p>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickLogin(acc.email)}
                    disabled={loading}
                    className="flex items-center justify-between text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all disabled:opacity-50"
                  >
                    <span>{acc.label}</span>
                    <span className="text-gray-400 font-normal">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40 mt-6 lg:hidden">Hecho por Lumini &middot; lumini.dev</p>
      </div>
    </div>
  );
}
