import { useAuthStore } from "@/store/authStore";
import { Receipt } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuthStore();
  const isPlatform = user?.role === "platform_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isPlatform ? "Facturacion" : "Mi plan CanchaPro"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isPlatform
            ? "Estado de facturacion de todos los clubes. Corte: fin de cada mes."
            : "Detalle de tu consumo y facturacion mensual. Corte: fin de mes."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          El modulo de facturacion estara disponible proximamente.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Los datos de facturacion se gestionaran desde el API de la plataforma.
        </p>
      </div>
    </div>
  );
}
