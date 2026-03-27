import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  SUPPORT_TICKETS,
  TICKET_MESSAGES,
  getStatusColor,
  getTicketStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getCategoryLabel,
} from "@/lib/mock-data";
import type { SupportTicket, TicketMessage, TicketStatus } from "@/lib/mock-data";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  CircleDot,
  Clock,
  Filter,
  GripVertical,
  Inbox,
  Kanban,
  List,
  MessageSquare,
  Search,
  Send,
  Tag,
  XCircle,
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

const KANBAN_COLUMNS: { status: TicketStatus; label: string; dotColor: string; headerColor: string }[] = [
  { status: "open", label: "Abierto", dotColor: "bg-amber-500", headerColor: "border-amber-400" },
  { status: "in_progress", label: "En progreso", dotColor: "bg-blue-500", headerColor: "border-blue-400" },
  { status: "resolved", label: "Resuelto", dotColor: "bg-emerald-500", headerColor: "border-emerald-400" },
  { status: "closed", label: "Cerrado", dotColor: "bg-gray-400", headerColor: "border-gray-400" },
];

type ViewMode = "list" | "kanban";

// ── Draggable ticket card ────────────────────────────────────────────────────

function DraggableTicketCard({
  ticket,
  messages,
  onSelect,
}: {
  ticket: SupportTicket;
  messages: TicketMessage[];
  onSelect: (t: SupportTicket) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  const msgCount = messages.filter((m) => m.ticketId === ticket.id).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full bg-white rounded-xl border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all p-3.5 group"
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0 touch-none"
          title="Arrastra para mover"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Card content — clickable */}
        <button onClick={() => onSelect(ticket)} className="flex-1 min-w-0 text-left space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate text-sm">{ticket.subject}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <Clock className="w-3 h-3" />
              {timeAgo(ticket.updatedAt)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
              {getPriorityLabel(ticket.priority)}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {getCategoryLabel(ticket.category)}
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {ticket.tenantName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{ticket.createdByName}</p>
            <div className="flex items-center gap-2">
              {msgCount > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {msgCount}
                </span>
              )}
              {ticket.assignedTo && (
                <p className="text-xs text-blue-600 font-medium">{ticket.assignedTo}</p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Static ticket card (for list view & overlay) ─────────────────────────────

function StaticTicketCard({
  ticket,
  messages,
  compact,
  onSelect,
}: {
  ticket: SupportTicket;
  messages: TicketMessage[];
  compact?: boolean;
  onSelect?: (t: SupportTicket) => void;
}) {
  const msgCount = messages.filter((m) => m.ticketId === ticket.id).length;
  return (
    <button
      onClick={() => onSelect?.(ticket)}
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
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {ticket.tenantName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{ticket.createdByName}</p>
          <div className="flex items-center gap-2">
            {msgCount > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {msgCount}
              </span>
            )}
            {ticket.assignedTo && (
              <p className="text-xs text-blue-600 font-medium">{ticket.assignedTo}</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Droppable column ─────────────────────────────────────────────────────────

function DroppableColumn({
  col,
  tickets,
  messages,
  onSelect,
}: {
  col: (typeof KANBAN_COLUMNS)[number];
  tickets: SupportTicket[];
  messages: TicketMessage[];
  onSelect: (t: SupportTicket) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      <div className={`border-t-2 ${col.headerColor} bg-white rounded-t-xl px-4 py-3 border border-gray-200 border-b-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
            <h3 className="text-sm font-semibold text-gray-900">{col.label}</h3>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {tickets.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-xl border border-gray-200 border-t-0 p-2.5 space-y-2.5 min-h-[200px] transition-colors ${
          isOver ? "bg-blue-50/80 border-blue-300" : "bg-gray-100/80"
        }`}
      >
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <p className="text-xs text-gray-400">
              {isOver ? "Soltar aqui" : "Sin tickets"}
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              messages={messages}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TicketQueuePage() {
  const authUser = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportTicket[]>(SUPPORT_TICKETS);
  const [messages, setMessages] = useState<TicketMessage[]>(TICKET_MESSAGES);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const allFiltered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.createdByName.toLowerCase().includes(search.toLowerCase())
  );

  const listFiltered = allFiltered
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .sort((a, b) => {
      const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
      const sDiff = statusOrder[a.status] - statusOrder[b.status];
      if (sDiff !== 0) return sDiff;
      const pDiff = pOrder[a.priority] - pOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedTicket]);

  function handleChangeStatus(ticketId: string, newStatus: TicketStatus) {
    setTickets(
      tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              assignedTo: newStatus === "in_progress" ? authUser?.name ?? t.assignedTo : t.assignedTo,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        assignedTo: newStatus === "in_progress" ? authUser?.name ?? selectedTicket.assignedTo : selectedTicket.assignedTo,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // ── DnD handlers ───────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as TicketStatus;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    handleChangeStatus(ticketId, newStatus);
  }

  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) : null;

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
          Volver a la cola
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="space-y-2">
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
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {selectedTicket.tenantName}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Por {selectedTicket.createdByName} &middot; {formatDateTime(selectedTicket.createdAt)}
              </p>
            </div>

            <div className="flex gap-2">
              {selectedTicket.status === "open" && (
                <button
                  onClick={() => handleChangeStatus(selectedTicket.id, "in_progress")}
                  className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  Tomar ticket
                </button>
              )}
              {(selectedTicket.status === "open" || selectedTicket.status === "in_progress") && (
                <button
                  onClick={() => handleChangeStatus(selectedTicket.id, "resolved")}
                  className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolver
                </button>
              )}
              {selectedTicket.status === "resolved" && (
                <button
                  onClick={() => handleChangeStatus(selectedTicket.id, "closed")}
                  className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cerrar
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{selectedTicket.description}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversacion ({ticketMessages.length})
            </h2>
          </div>

          {ticketMessages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin mensajes aun</p>
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
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">CanchaPro</span>
                      )}
                      {msg.authorRole !== "platform_admin" && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {msg.authorRole === "super_admin" ? "Admin" : "Staff"}
                        </span>
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
                    placeholder="Responder al ticket..."
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

  // ── Queue view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cola de tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Tickets de soporte de todos los clubes</p>
        </div>
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
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{openCount}</p>
            <p className="text-xs text-gray-500">Abiertos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            <p className="text-xs text-gray-500">En progreso</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
            <p className="text-xs text-gray-500">Resueltos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar ticket, club o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            {listFiltered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">No hay tickets que mostrar</p>
              </div>
            ) : (
              listFiltered.map((ticket) => (
                <StaticTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  messages={messages}
                  onSelect={setSelectedTicket}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Kanban view with DnD ── */}
      {viewMode === "kanban" && (
        <>
          <p className="text-xs text-gray-400">
            Arrastra los tickets entre columnas para cambiar su estado
          </p>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8">
              {KANBAN_COLUMNS.map((col) => {
                const colTickets = allFiltered
                  .filter((t) => t.status === col.status)
                  .sort((a, b) => {
                    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return pOrder[a.priority] - pOrder[b.priority] || b.updatedAt.localeCompare(a.updatedAt);
                  });
                return (
                  <DroppableColumn
                    key={col.status}
                    col={col}
                    tickets={colTickets}
                    messages={messages}
                    onSelect={setSelectedTicket}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeTicket && (
                <div className="w-80 opacity-90 rotate-2 shadow-xl">
                  <StaticTicketCard
                    ticket={activeTicket}
                    messages={messages}
                    compact
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
}
