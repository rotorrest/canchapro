import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  getStatusColor,
  getTicketStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getCategoryLabel,
} from "@/lib/domain";

// ── Local types & mock data (no API endpoint yet) ───────────────────────────

type TicketPriority = "low" | "medium" | "high" | "urgent";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketCategory = "bug" | "feature" | "billing" | "account" | "other";

interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  createdById: string;
  createdByName: string;
  createdByRole: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

const SUPPORT_TICKETS: SupportTicket[] = [
  { id: "st1", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u1", createdByName: "Carlos Mendoza", createdByRole: "super_admin", subject: "Error al generar reporte mensual", description: "Al intentar exportar el reporte de creditos del mes de febrero, el sistema muestra un error 500.", category: "bug", priority: "high", status: "open", assignedTo: null, createdAt: "2026-03-25T10:00:00", updatedAt: "2026-03-25T10:00:00" },
  { id: "st2", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u2", createdByName: "Ana Torres", createdByRole: "staff", subject: "Solicitud de modulo de torneos", description: "Nos gustaria poder organizar torneos desde la plataforma.", category: "feature", priority: "medium", status: "in_progress", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-20T14:00:00", updatedAt: "2026-03-22T09:00:00" },
  { id: "st4", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u1", createdByName: "Carlos Mendoza", createdByRole: "super_admin", subject: "Agregar segundo admin al sistema", description: "Necesito que mi socio tambien tenga acceso de administrador.", category: "account", priority: "low", status: "resolved", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-10T16:00:00", updatedAt: "2026-03-12T10:00:00" },
];

const TICKET_MESSAGES: TicketMessage[] = [
  { id: "tm1", ticketId: "st1", authorId: "u1", authorName: "Carlos Mendoza", authorRole: "super_admin", text: "Adjunto captura del error. Ocurre solo con el reporte de febrero.", createdAt: "2026-03-25T10:05:00" },
  { id: "tm2", ticketId: "st2", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "Gracias por la sugerencia. El modulo de torneos esta en nuestro roadmap para Q2.", createdAt: "2026-03-22T09:00:00" },
  { id: "tm3", ticketId: "st2", authorId: "u2", authorName: "Ana Torres", authorRole: "staff", text: "Genial! Los socios lo piden mucho.", createdAt: "2026-03-22T11:00:00" },
  { id: "tm4", ticketId: "st4", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "Listo, Carlos. Ya agregue a tu socio como admin.", createdAt: "2026-03-12T10:00:00" },
];
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  CircleDot,
  Clock,
  Filter,
  Kanban,
  List,
  MessageSquare,
  Plus,
  Send,
  Tag,
  X,
} from "lucide-react";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Hace minutos";
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

const categories: { id: TicketCategory; label: string }[] = [
  { id: "bug", label: "Error" },
  { id: "feature", label: "Mejora" },
  { id: "billing", label: "Facturacion" },
  { id: "account", label: "Cuenta" },
  { id: "other", label: "Otro" },
];

const priorities: { id: TicketPriority; label: string }[] = [
  { id: "low", label: "Baja" },
  { id: "medium", label: "Media" },
  { id: "high", label: "Alta" },
  { id: "urgent", label: "Urgente" },
];

const KANBAN_COLUMNS: { status: TicketStatus; label: string; dotColor: string; headerColor: string }[] = [
  { status: "open", label: "Abierto", dotColor: "bg-amber-500", headerColor: "border-amber-400" },
  { status: "in_progress", label: "En progreso", dotColor: "bg-blue-500", headerColor: "border-blue-400" },
  { status: "resolved", label: "Resuelto", dotColor: "bg-emerald-500", headerColor: "border-emerald-400" },
  { status: "closed", label: "Cerrado", dotColor: "bg-gray-400", headerColor: "border-gray-400" },
];

type ViewMode = "list" | "kanban";

export default function SupportPage() {
  const authUser = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportTicket[]>(SUPPORT_TICKETS);
  const [messages, setMessages] = useState<TicketMessage[]>(TICKET_MESSAGES);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [messageSent, setMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "bug" as TicketCategory,
    priority: "medium" as TicketPriority,
  });

  // Filter to current tenant's tickets (Ica Padel Club = t1)
  const myTickets = tickets
    .filter((t) => t.tenantId === "t1")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const filteredTickets = myTickets.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  function handleCreate() {
    if (!form.subject || !form.description || !authUser) return;
    const ticket: SupportTicket = {
      id: `st${Date.now()}`,
      tenantId: "t1",
      tenantName: "Ica Padel Club",
      createdById: authUser.id,
      createdByName: authUser.name,
      createdByRole: authUser.role,
      subject: form.subject,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "open",
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTickets([...tickets, ticket]);
    setShowForm(false);
    setForm({ subject: "", description: "", category: "bug", priority: "medium" });
  }

  function handleSendMessage() {
    if (!newMessage.trim() || !selectedTicket || !authUser) return;
    const msg: TicketMessage = {
      id: `tm${Date.now()}`,
      ticketId: selectedTicket.id,
      authorId: authUser.id,
      authorName: authUser.name,
      authorRole: authUser.role,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 2000);
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedTicket]);

  const ticketMessages = selectedTicket
    ? messages.filter((m) => m.ticketId === selectedTicket.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tickets
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`font-medium px-2 py-0.5 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                  {getTicketStatusLabel(selectedTicket.status)}
                </span>
                <span className={`font-medium px-2 py-0.5 rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                  {getPriorityLabel(selectedTicket.priority)}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {getCategoryLabel(selectedTicket.category)}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Creado {formatDateTime(selectedTicket.createdAt)}</p>
              {selectedTicket.assignedTo && (
                <p className="text-blue-600 font-medium mt-1">Asignado a: {selectedTicket.assignedTo}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{selectedTicket.description}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensajes ({ticketMessages.length})
            </h2>
          </div>

          {ticketMessages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              Sin mensajes aun. Escribe el primer mensaje.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {ticketMessages.map((msg) => (
                <div key={msg.id} className="p-5 flex gap-4">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      msg.authorRole === "platform_admin"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {msg.authorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{msg.authorName}</p>
                      {msg.authorRole === "platform_admin" && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Soporte</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Sent indicator */}
          {messageSent && (
            <div className="px-5 py-2 bg-emerald-50 text-xs text-emerald-700 font-medium text-center">
              Mensaje enviado
            </div>
          )}

          {selectedTicket.status !== "closed" && (
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                  {authUser?.name?.charAt(0)}
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    rows={2}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="self-end bg-blue-800 text-white p-2.5 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Ticket card (shared between list and kanban) ─────────────────────────
  function TicketCard({ ticket, compact }: { ticket: SupportTicket; compact?: boolean }) {
    const msgCount = messages.filter((m) => m.ticketId === ticket.id).length;
    return (
      <button
        onClick={() => setSelectedTicket(ticket)}
        className={`w-full bg-white rounded-xl border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all ${
          compact ? "p-3.5" : "p-5"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CircleDot
                className={`w-3.5 h-3.5 shrink-0 ${
                  ticket.status === "open"
                    ? "text-amber-500"
                    : ticket.status === "in_progress"
                      ? "text-blue-500"
                      : ticket.status === "resolved"
                        ? "text-emerald-500"
                        : "text-gray-400"
                }`}
              />
              <p className={`font-semibold text-gray-900 truncate ${compact ? "text-sm" : ""}`}>
                {ticket.subject}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <Clock className="w-3 h-3" />
              {timeAgo(ticket.updatedAt)}
            </div>
          </div>

          {!compact && (
            <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {!compact && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                {getTicketStatusLabel(ticket.status)}
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
              {getPriorityLabel(ticket.priority)}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {getCategoryLabel(ticket.category)}
            </span>
            {msgCount > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                <MessageSquare className="w-3 h-3" />
                {msgCount}
              </span>
            )}
          </div>

          {ticket.assignedTo && (
            <p className="text-xs text-blue-600 font-medium">{ticket.assignedTo}</p>
          )}
        </div>
      </button>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-500 mt-1">Envia tickets al equipo de CanchaPro</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <Dialog.Root open={showForm} onOpenChange={setShowForm}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                <Plus className="w-4 h-4" />
                Nuevo ticket
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-bold text-gray-900">Nuevo ticket de soporte</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Cerrar">
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Crear un nuevo ticket de soporte</Dialog.Description>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe brevemente el problema"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Describe el problema en detalle..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {priorities.map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Dialog.Close asChild>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleCreate}
                    disabled={!form.subject || !form.description}
                    className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    Crear ticket
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* ── List view ── */}
      {viewMode === "list" && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {[
              { value: "all", label: "Todos" },
              { value: "open", label: "Abiertos" },
              { value: "in_progress", label: "En progreso" },
              { value: "resolved", label: "Resueltos" },
              { value: "closed", label: "Cerrados" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">No hay tickets</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Kanban view ── */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8">
          {KANBAN_COLUMNS.map((col) => {
            const colTickets = myTickets.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="flex-shrink-0 w-72 flex flex-col">
                {/* Column header */}
                <div className={`border-t-2 ${col.headerColor} bg-white rounded-t-xl px-4 py-3 border border-gray-200 border-b-0`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <h3 className="text-sm font-semibold text-gray-900">{col.label}</h3>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {colTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column body */}
                <div className="flex-1 bg-gray-100/80 rounded-b-xl border border-gray-200 border-t-0 p-2.5 space-y-2.5 min-h-[200px]">
                  {colTickets.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[120px]">
                      <p className="text-xs text-gray-400">Sin tickets</p>
                    </div>
                  ) : (
                    colTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} compact />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
