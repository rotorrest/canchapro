import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/mock-data";
import type { MemberComment } from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Receipt,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

type Tab = "overview" | "purchases" | "credits" | "bookings" | "comments";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Resumen", icon: User },
  { id: "purchases", label: "Compras", icon: Receipt },
  { id: "credits", label: "Creditos", icon: Wallet },
  { id: "bookings", label: "Reservas", icon: CalendarDays },
  { id: "comments", label: "Comentarios", icon: MessageSquare },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const td = useTenantData();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [comments, setComments] = useState<MemberComment[]>(td.memberComments);
  const [newComment, setNewComment] = useState("");

  const member = td.members.find((m) => m.id === id);
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-gray-500">Miembro no encontrado</p>
        <button onClick={() => navigate("/members")} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Volver a miembros
        </button>
      </div>
    );
  }

  const memberBookings = td.bookings.filter((b) => b.memberId === member.id).sort(
    (a, b) => b.startTime.localeCompare(a.startTime)
  );
  const memberTransactions = td.transactions.filter((t) => t.memberId === member.id).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
  const memberSales = td.creditSales.filter((s) => s.memberId === member.id).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
  const memberComments = comments
    .filter((c) => c.memberId === member.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalSpent = memberTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPurchased = memberSales.reduce((s, t) => s + t.amount, 0);
  const totalBookings = memberBookings.length;
  const completedBookings = memberBookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = memberBookings.filter((b) => b.status === "cancelled").length;

  const initials = member.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleAddComment() {
    if (!newComment.trim() || !authUser) return;
    const comment: MemberComment = {
      id: `mc${Date.now()}`,
      tenantId: td.tenantId ?? "t1",
      memberId: member!.id,
      authorId: authUser.id,
      authorName: authUser.name,
      authorRole: authUser.role,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, comment]);
    setNewComment("");
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/members")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a miembros
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{member.user.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(member.user.status)}`}>
                {getStatusLabel(member.user.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{member.user.email}</p>
            <p className="text-xs text-gray-400">
              Miembro desde marzo 2026 &middot; ID: {member.id}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{member.creditBalance}</p>
              <p className="text-xs text-gray-500">Creditos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{member.creditAllocationMonthly}</p>
              <p className="text-xs text-gray-500">cr/mes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Saldo actual</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{member.creditBalance} cr</p>
            <p className="text-xs text-gray-400 mt-1">de {member.creditAllocationMonthly} cr/mes</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-500">Total comprado</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalPurchased} cr</p>
            <p className="text-xs text-gray-400 mt-1">{memberSales.length} compras</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500">Total gastado</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSpent} cr</p>
            <p className="text-xs text-gray-400 mt-1">en {memberTransactions.filter((t) => t.amount < 0).length} transacciones</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500">Reservas</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            <p className="text-xs text-gray-400 mt-1">
              {completedBookings} completadas &middot; {cancelledBookings} canceladas
            </p>
          </div>

          {/* Last booking */}
          {member.lastBookingAt && (
            <div className="sm:col-span-2 lg:col-span-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-700 font-medium">Ultima reserva</p>
              <p className="text-sm text-blue-900 mt-1">{formatDateTime(member.lastBookingAt)}</p>
            </div>
          )}

          {/* Recent comments preview */}
          {memberComments.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Comentarios recientes</p>
                <button
                  onClick={() => setActiveTab("comments")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todos ({memberComments.length})
                </button>
              </div>
              <div className="space-y-3">
                {memberComments.slice(0, 2).map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                      {c.authorName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900">{c.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.authorName} &middot; {formatDate(c.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "purchases" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Historial de compras
            </h2>
          </div>
          {memberSales.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin compras registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Creditos</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Metodo</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Vendido por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500">{formatDateTime(sale.createdAt)}</td>
                      <td className="px-5 py-3 text-right font-medium text-emerald-600">+{sale.amount} cr</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{sale.soldBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "credits" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Movimientos de creditos
            </h2>
          </div>
          {memberTransactions.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin movimientos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Tipo</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Razon</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500">{formatDateTime(t.createdAt)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            t.type === "allocation"
                              ? "bg-emerald-100 text-emerald-700"
                              : t.type === "deduction"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {t.type === "allocation" ? "Asignacion" : t.type === "deduction" ? "Deduccion" : "Ajuste"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{t.reason}</td>
                      <td className={`px-5 py-3 text-right font-medium ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {t.amount >= 0 ? "+" : ""}{t.amount} cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Historial de reservas
            </h2>
          </div>
          {memberBookings.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin reservas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Cancha</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Horario</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Creditos</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500">{formatDate(b.startTime)}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{b.courtName}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(b.startTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(b.endTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{b.creditsDeducted} cr</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(b.status)}`}>
                          {b.status === "confirmed" ? "Confirmada" : b.status === "completed" ? "Completada" : "Cancelada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          {/* Add comment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" />
              Agregar comentario
            </h2>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                {authUser?.name?.charAt(0)}
              </div>
              <div className="flex-1 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe una nota sobre este socio..."
                  rows={2}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="self-end bg-blue-800 text-white p-2.5 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Comments list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {memberComments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin comentarios</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {memberComments.map((c) => (
                  <div key={c.id} className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                      {c.authorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{c.authorName}</p>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c.authorRole === "super_admin" ? "Admin" : "Staff"}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
