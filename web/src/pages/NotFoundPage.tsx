import { Link } from "react-router-dom";
import PadelIcon from "@/components/PadelIcon";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
        <PadelIcon className="w-7 h-7 text-blue-400" />
      </div>
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Pagina no encontrada</p>
      <Link
        to="/"
        className="mt-2 bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
