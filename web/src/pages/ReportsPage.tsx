import { useState, useMemo } from "react";
import { subDays, format, isWithinInterval, parseISO } from "date-fns";
import { Download, FileSpreadsheet, Receipt, CalendarDays } from "lucide-react";
import DatePicker from "@/components/DatePicker";
import {
  getPaymentMethodLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";

type Tab = "ventas" | "reservas" | "resumen";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateES(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy");
}

function formatAmount(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export default function ReportsPage() {
  const td = useTenantData();
  const [tab, setTab] = useState<Tab>("ventas");
  const [startDate, setStartDate] = useState<Date | undefined>(
    subDays(new Date(), 30)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filteredSales = useMemo(() => {
    return td.creditSales.filter((sale) => {
      if (!startDate || !endDate) return true;
      const saleDate = parseISO(sale.createdAt);
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });
  }, [startDate, endDate]);

  const filteredBookings = useMemo(() => {
    return td.bookings.filter((booking) => {
      if (!startDate || !endDate) return true;
      const bookingDate = parseISO(booking.startTime);
      return isWithinInterval(bookingDate, { start: startDate, end: endDate });
    });
  }, [startDate, endDate]);

  const summary = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalCredits = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const estimatedRevenue = totalCredits * 3;
    const totalBookings = filteredBookings.length;
    const creditsConsumed = filteredBookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.creditsDeducted, 0);
    const cancelledCount = filteredBookings.filter(
      (b) => b.status === "cancelled"
    ).length;
    const cancellationRate =
      totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

    return {
      totalSales,
      totalCredits,
      estimatedRevenue,
      totalBookings,
      creditsConsumed,
      cancellationRate,
    };
  }, [filteredSales, filteredBookings]);

  function exportSalesCSV() {
    const headers = ["Fecha", "Socio", "Creditos", "Metodo de pago", "Vendido por"];
    const rows = filteredSales.map((s) => [
      formatDateES(s.createdAt),
      s.memberName,
      formatAmount(s.amount, 0),
      getPaymentMethodLabel(s.paymentMethod),
      s.soldBy,
    ]);
    downloadCSV("ventas_creditos.csv", headers, rows);
  }

  function exportBookingsCSV() {
    const headers = [
      "Fecha",
      "Socio",
      "Cancha",
      "Horario",
      "Creditos",
      "Estado",
    ];
    const rows = filteredBookings.map((b) => [
      formatDateES(b.startTime),
      b.memberName,
      b.courtName,
      `${format(parseISO(b.startTime), "HH:mm")} - ${format(parseISO(b.endTime), "HH:mm")}`,
      formatAmount(b.creditsDeducted, 0),
      getStatusLabel(b.status),
    ]);
    downloadCSV("reservas_consumo.csv", headers, rows);
  }

  function exportSummaryCSV() {
    const headers = ["Indicador", "Valor"];
    const rows = [
      ["Total ventas", formatAmount(summary.totalSales, 0)],
      ["Total creditos vendidos", formatAmount(summary.totalCredits, 0)],
      ["Ingresos estimados (S/)", formatAmount(summary.estimatedRevenue, 2)],
      ["Total reservas", formatAmount(summary.totalBookings, 0)],
      ["Creditos consumidos", formatAmount(summary.creditsConsumed, 0)],
      ["Tasa de cancelacion (%)", formatAmount(summary.cancellationRate, 2)],
    ];
    downloadCSV("resumen_mensual.csv", headers, rows);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "ventas",
      label: "Ventas de creditos",
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      key: "reservas",
      label: "Reservas y consumo",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      key: "resumen",
      label: "Resumen mensual",
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Reportes SUNAT
      </h1>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Desde</span>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Fecha inicio"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Hasta</span>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "ventas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredSales.length} venta{filteredSales.length !== 1 && "s"} en
              el periodo
            </p>
            <button
              onClick={exportSalesCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Fecha
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Socio
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">
                      Creditos
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Metodo
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Vendido por
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-500">
                        {formatDateES(sale.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {sale.memberName}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">
                        {sale.amount} cr
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {sale.soldBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSales.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                No se encontraron ventas en el periodo seleccionado
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "reservas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredBookings.length} reserva
              {filteredBookings.length !== 1 && "s"} en el periodo
            </p>
            <button
              onClick={exportBookingsCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Fecha
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Socio
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Cancha
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Horario
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">
                      Creditos
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-500">
                        {formatDateES(b.startTime)}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {b.memberName}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {b.courtName}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {format(parseISO(b.startTime), "HH:mm")} –{" "}
                        {format(parseISO(b.endTime), "HH:mm")}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">
                        {b.creditsDeducted} cr
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(b.status)}`}
                        >
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                No se encontraron reservas en el periodo seleccionado
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "resumen" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={exportSummaryCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total ventas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalSales}
              </p>
            </div>

            {/* Total creditos vendidos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total creditos vendidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalCredits} cr
              </p>
            </div>

            {/* Ingresos estimados */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Ingresos estimados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                S/{formatAmount(summary.estimatedRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                A S/3.00 por credito
              </p>
            </div>

            {/* Total reservas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total reservas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalBookings}
              </p>
            </div>

            {/* Creditos consumidos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Creditos consumidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.creditsConsumed} cr
              </p>
            </div>

            {/* Tasa de cancelacion */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Tasa de cancelacion</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatAmount(summary.cancellationRate)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
