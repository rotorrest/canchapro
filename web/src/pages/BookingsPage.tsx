import { useMemo, useState } from "react";
import { getStatusColor, getStatusLabel, getBookingDisplayStatus } from "@/lib/mock-data";
import type { Booking } from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";
import { useSedeStore } from "@/store/sedeStore";
import { MapPin, Search, ScanLine, CheckCircle } from "lucide-react";

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "in_progress", label: "En curso" },
  { key: "completed", label: "Completadas" },
  { key: "no_show", label: "No asistio" },
  { key: "cancelled", label: "Canceladas" },
];

export default function BookingsPage() {
  const td = useTenantData();
  const { selectedSede } = useSedeStore();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>(td.bookings);
  const [scanning, setScanning] = useState(false);
  const [checkedIn, setCheckedIn] = useState<Booking | null>(null);

  const activeSedeName = selectedSede ? td.sedes.find((s) => s.id === selectedSede)?.name : null;

  const bookingsWithDisplay = useMemo(
    () => bookings.map((b) => ({ ...b, displayStatus: getBookingDisplayStatus(b) })),
    [bookings]
  );

  const filtered = bookingsWithDisplay
    .filter((b) => {
      if (filter !== "all" && b.displayStatus !== filter) return false;
      if (search && !b.memberName.toLowerCase().includes(search.toLowerCase()) && !b.courtName.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedSede) {
        const court = td.courts.find((c) => c.id === b.courtId);
        if (!court || court.sedeId !== selectedSede) return false;
      }
      return true;
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime)); // most recent first

  function simulateCheckin() {
    setScanning(true);
    setCheckedIn(null);
    setTimeout(() => {
      // Find a confirmed booking to "check in"
      const confirmed = bookings.find((b) => b.status === "confirmed");
      if (confirmed) {
        setBookings(bookings.map((b) =>
          b.id === confirmed.id ? { ...b, status: "completed" as const } : b
        ));
        setCheckedIn(confirmed);
      }
      setScanning(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          {td.hasMultipleSedes && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {activeSedeName ?? "Todas las sedes"}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={simulateCheckin}
          disabled={scanning}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
          <ScanLine className="w-4 h-4" />
          {scanning ? "Escaneando..." : "Check-in QR"}
        </button>
      </div>

      {/* Scan animation */}
      {scanning && (
        <div className="bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-48 h-48 border-2 border-blue-400 rounded-xl flex items-center justify-center relative">
            <div className="absolute inset-x-4 h-0.5 bg-blue-400 animate-pulse" style={{ top: "50%" }} />
            <ScanLine className="w-12 h-12 text-blue-400 animate-pulse" />
          </div>
          <p className="text-sm text-blue-300">Escaneando QR del socio...</p>
        </div>
      )}

      {/* Check-in success */}
      {checkedIn && !scanning && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-emerald-800">Check-in exitoso</p>
            <p className="text-sm text-emerald-600">
              {checkedIn.memberName} — {checkedIn.courtName} — {" "}
              {new Date(checkedIn.startTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              –
              {new Date(checkedIn.endTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={() => setCheckedIn(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar por miembro o cancha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Miembro</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Cancha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Hora</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Creditos</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{b.memberName}</td>
                  <td className="px-5 py-3 text-gray-500">{b.courtName}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(b.startTime).toLocaleDateString("es-PE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(b.startTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    –
                    {new Date(b.endTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {b.creditsDeducted} cr
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(b.displayStatus)}`}>
                      {getStatusLabel(b.displayStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {b.displayStatus === "confirmed" && (
                        <button
                          onClick={() => setBookings(bookings.map((x) => x.id === b.id ? { ...x, status: "cancelled" as const, cancelledAt: new Date().toISOString() } : x))}
                          className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      {(b.displayStatus === "completed" || b.displayStatus === "in_progress") && b.status !== "no_show" && (
                        <button
                          onClick={() => setBookings(bookings.map((x) => x.id === b.id ? { ...x, status: "no_show" as const } : x))}
                          className="text-xs font-medium text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          No asistio
                        </button>
                      )}
                      {(b.displayStatus === "cancelled" || b.displayStatus === "no_show") && (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No se encontraron reservas</p>
        )}
      </div>
    </div>
  );
}
