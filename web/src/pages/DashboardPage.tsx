import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  MapPin,
  Percent,
  TrendingUp,
  XCircle,
  UserX,
  BarChart3,
} from "lucide-react";
import {
  DAILY_STATS,
  HEATMAP_DATA,
  BOOKINGS_BY_COURT,
  filterByDateRange,
} from "@/lib/mock-charts";
import { getBookingDisplayStatus } from "@/lib/mock-data";
import DatePicker from "@/components/DatePicker";
import { useSedeStore } from "@/store/sedeStore";
import { useTenantData } from "@/hooks/useTenantData";

const today = new Date();

export default function DashboardPage() {
  const [fromDate, setFromDate] = useState<Date>(subDays(today, 13));
  const [toDate, setToDate] = useState<Date>(today);
  const { selectedSede } = useSedeStore();
  const td = useTenantData();
  const activeSedeName = selectedSede ? td.sedes.find((s) => s.id === selectedSede)?.name : null;

  // Real KPIs from actual booking data
  const kpis = useMemo(() => {
    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);
    const rangeBookings = td.bookings.filter((b) => {
      if (selectedSede) {
        const court = td.courts.find((c) => c.id === b.courtId);
        if (!court || court.sedeId !== selectedSede) return false;
      }
      const t = new Date(b.startTime);
      return t >= from && t <= to;
    });

    const total = rangeBookings.length;
    const withStatus = rangeBookings.map((b) => ({ ...b, ds: getBookingDisplayStatus(b) }));
    const completed = withStatus.filter((b) => b.ds === "completed").length;
    const cancelled = rangeBookings.filter((b) => b.status === "cancelled").length;
    const noShows = rangeBookings.filter((b) => b.status === "no_show").length;
    const credits = rangeBookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + b.creditsDeducted, 0);
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
    const activeCourts = td.courts.filter((c) => c.isActive).length;
    const totalSlots = activeCourts * 16 * days;
    const occupancy = totalSlots > 0 ? Math.min(95, Math.round((total / totalSlots) * 100)) : 0;

    return {
      totalBookings: total,
      totalCompleted: completed,
      totalCredits: +credits.toFixed(1),
      totalCancellations: cancelled,
      totalNoShows: noShows,
      avgOccupancy: occupancy,
      avgBookingsPerDay: total > 0 ? +(total / days).toFixed(1) : 0,
      completionRate: total > 0 ? +((completed / total) * 100).toFixed(1) : 0,
      cancellationRate: total > 0 ? +((cancelled / total) * 100).toFixed(1) : 0,
      noShowRate: total > 0 ? +((noShows / total) * 100).toFixed(1) : 0,
    };
  }, [td.bookings, td.courts, fromDate, toDate, selectedSede]);

  // Keep chart trends as mock data (needs historical series)
  const chartData = useMemo(
    () => filterByDateRange(DAILY_STATS, fromDate, toDate),
    [fromDate, toDate]
  );

  const kpiCards = [
    { label: "Reservas totales", value: kpis.totalBookings, icon: CalendarDays, color: "text-blue-700 bg-blue-50" },
    { label: "Completadas", value: kpis.totalCompleted, sub: `${kpis.completionRate}%`, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Creditos consumidos", value: kpis.totalCredits, icon: CreditCard, color: "text-blue-600 bg-blue-50" },
    { label: "Ocupacion promedio", value: `${kpis.avgOccupancy}%`, icon: Percent, color: "text-violet-600 bg-violet-50" },
    { label: "Reservas / dia", value: kpis.avgBookingsPerDay, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
    { label: "Cancelaciones", value: kpis.totalCancellations, sub: `${kpis.cancellationRate}%`, icon: XCircle, color: "text-red-500 bg-red-50" },
    { label: "No asistieron", value: kpis.totalNoShows, sub: `${kpis.noShowRate}%`, icon: UserX, color: "text-orange-500 bg-orange-50" },
    { label: "Tasa efectividad", value: `${kpis.completionRate}%`, sub: "completadas / total", icon: BarChart3, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {td.hasMultipleSedes && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {activeSedeName ? activeSedeName : "Todas las sedes"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DatePicker
            value={fromDate}
            onChange={(d) => d && setFromDate(d)}
            placeholder="Desde"
          />
          <span className="text-gray-400 text-sm">a</span>
          <DatePicker
            value={toDate}
            onChange={(d) => d && setToDate(d)}
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {kpiCards.map((k) => {
          const [iconColor, bgColor] = k.color.split(" ");
          return (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 px-3.5 py-3 flex flex-col gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
                <k.icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none truncate">{k.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-xl font-bold text-gray-900 leading-none tabular-nums">{k.value}</p>
                  {"sub" in k && k.sub && (
                    <span className="text-[10px] font-medium text-gray-400 leading-none">{k.sub}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings per day */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Reservas por dia</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={chartData.length > 20 ? 8 : 16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="completed" name="Completadas" fill="#1d4ed8" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="noShows" name="No asistieron" fill="#fb923c" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="cancellations" name="Canceladas" fill="#fca5a5" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credits consumed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Creditos consumidos por dia</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="creditsConsumed"
                  name="Creditos"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#1d4ed8" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Ocupacion por horario</h2>
          <OccupancyHeatmap />
        </div>

        {/* Bookings by court pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Reservas por cancha</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={BOOKINGS_BY_COURT}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {BOOKINGS_BY_COURT.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {BOOKINGS_BY_COURT.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occupancy trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Tendencia de ocupacion (%)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value) => [`${value}%`, "Ocupacion"]}
              />
              <Line
                type="monotone"
                dataKey="occupancyRate"
                name="Ocupacion"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3, fill: "#059669" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap component ────────────────────────────────────────────────────────

function OccupancyHeatmap() {
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6–21

  function getCell(day: number, hour: number) {
    return HEATMAP_DATA.find((c) => c.dayOfWeek === day && c.hour === hour);
  }

  function intensityColor(intensity: number): string {
    if (intensity < 0.2) return "bg-blue-50";
    if (intensity < 0.4) return "bg-blue-100";
    if (intensity < 0.6) return "bg-blue-200";
    if (intensity < 0.8) return "bg-blue-400 text-white";
    return "bg-blue-700 text-white";
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row */}
        <div className="flex gap-1 mb-1">
          <div className="w-10 shrink-0" />
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
              {h}:00
            </div>
          ))}
        </div>

        {/* Rows */}
        {days.map((dayLabel, dayIdx) => (
          <div key={dayLabel} className="flex gap-1 mb-1">
            <div className="w-10 shrink-0 text-xs text-gray-500 font-medium flex items-center">
              {dayLabel}
            </div>
            {hours.map((hour) => {
              const cell = getCell(dayIdx, hour);
              const intensity = cell?.intensity ?? 0;
              return (
                <div
                  key={hour}
                  className={`flex-1 aspect-[2/1] rounded-sm flex items-center justify-center text-[10px] font-medium cursor-default transition-colors ${intensityColor(intensity)}`}
                  title={`${dayLabel} ${hour}:00 — ${cell?.bookings ?? 0} reservas (prom.)`}
                >
                  {cell ? cell.bookings.toFixed(0) : ""}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-gray-400">
          <span>Menos</span>
          <div className="w-4 h-3 rounded-sm bg-blue-50" />
          <div className="w-4 h-3 rounded-sm bg-blue-100" />
          <div className="w-4 h-3 rounded-sm bg-blue-200" />
          <div className="w-4 h-3 rounded-sm bg-blue-400" />
          <div className="w-4 h-3 rounded-sm bg-blue-700" />
          <span>Mas</span>
        </div>
      </div>
    </div>
  );
}
