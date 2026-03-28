import type { Sede } from "@/hooks/useTenantData";
import { MapPin } from "lucide-react";

interface SedeSelectorProps {
  sedes: Sede[];
  selected: string | null; // null = todas
  onChange: (sedeId: string | null) => void;
}

export default function SedeSelector({ sedes, selected, onChange }: SedeSelectorProps) {
  if (sedes.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          selected === null
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Todas las sedes
      </button>
      {sedes.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            selected === s.id
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
