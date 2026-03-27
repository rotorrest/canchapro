import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStatusColor,
  getStatusLabel,
  type Member,
  type ClubUser,
  type Role,
} from "@/lib/mock-data";
import { useTenantData } from "@/hooks/useTenantData";
import {
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// ── Role meta ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Administrador",
  staff: "Staff",
  member: "Socio",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700",
  staff: "bg-blue-100 text-blue-700",
  member: "bg-emerald-100 text-emerald-700",
};

const POSITION_SUGGESTIONS = [
  "Director general",
  "Gerente de operaciones",
  "Administrador",
  "Recepcionista",
  "Instructor de padel",
  "Instructor de tenis",
  "Instructor jefe",
  "Mantenimiento",
  "Seguridad",
  "Otro",
];

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const gradient =
    role === "super_admin"
      ? "from-violet-500 to-violet-700"
      : role === "staff"
      ? "from-blue-500 to-blue-700"
      : "from-emerald-500 to-emerald-700";

  return (
    <div
      className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}

// ── Form types ────────────────────────────────────────────────────────────────

type Tab = "socios" | "staff" | "admins";

interface PersonForm {
  name: string;
  email: string;
  phone: string;
  position: string;
  allocation: number;
  status: "active" | "suspended" | "inactive";
}

const EMPTY_FORM: PersonForm = {
  name: "",
  email: "",
  phone: "",
  position: "",
  allocation: 50,
  status: "active",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const navigate = useNavigate();
  const td = useTenantData();

  const [members, setMembers] = useState<Member[]>(td.members);
  const [clubUsers, setClubUsers] = useState<ClubUser[]>(td.clubUsers);

  const [activeTab, setActiveTab] = useState<Tab>("socios");
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<
    { type: "member"; id: string } | { type: "clubuser"; id: string } | null
  >(null);
  const [form, setForm] = useState<PersonForm>(EMPTY_FORM);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "member" | "clubuser";
    id: string;
    name: string;
  } | null>(null);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const staffUsers = clubUsers.filter((u) => u.user.role === "staff");
  const adminUsers = clubUsers.filter((u) => u.user.role === "super_admin");

  const filteredMembers = members.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStaff = staffUsers.filter(
    (u) =>
      u.user.name.toLowerCase().includes(search.toLowerCase()) ||
      u.user.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAdmins = adminUsers.filter(
    (u) =>
      u.user.name.toLowerCase().includes(search.toLowerCase()) ||
      u.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Open add modal ─────────────────────────────────────────────────────────

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  // ── Open edit modal ────────────────────────────────────────────────────────

  function openEditMember(m: Member) {
    setEditTarget({ type: "member", id: m.id });
    setForm({
      name: m.user.name,
      email: m.user.email,
      phone: "",
      position: "",
      allocation: m.creditAllocationMonthly,
      status: m.user.status,
    });
    setModalOpen(true);
  }

  function openEditClubUser(u: ClubUser) {
    setEditTarget({ type: "clubuser", id: u.id });
    setForm({
      name: u.user.name,
      email: u.user.email,
      phone: u.phone ?? "",
      position: u.position ?? "",
      allocation: 0,
      status: u.user.status,
    });
    setModalOpen(true);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (editTarget) {
      if (editTarget.type === "member") {
        setMembers(
          members.map((m) =>
            m.id === editTarget.id
              ? {
                  ...m,
                  user: { ...m.user, name: form.name, email: form.email, status: form.status },
                  creditAllocationMonthly: form.allocation,
                }
              : m
          )
        );
      } else {
        setClubUsers(
          clubUsers.map((u) =>
            u.id === editTarget.id
              ? {
                  ...u,
                  user: { ...u.user, name: form.name, email: form.email, status: form.status },
                  phone: form.phone || null,
                  position: form.position || null,
                }
              : u
          )
        );
      }
    } else {
      // Add new
      const role: Role =
        activeTab === "admins" ? "super_admin" : activeTab === "staff" ? "staff" : "member";

      if (role === "member") {
        const newMember: Member = {
          id: `m${Date.now()}`,
          tenantId: td.tenantId ?? "t1",
          user: {
            id: `u${Date.now()}`,
            email: form.email,
            name: form.name,
            role: "member",
            status: form.status,
          },
          creditBalance: form.allocation,
          creditAllocationMonthly: form.allocation,
          lastBookingAt: null,
        };
        setMembers([...members, newMember]);
      } else {
        const newClubUser: ClubUser = {
          id: `cu${Date.now()}`,
          tenantId: td.tenantId ?? "t1",
          user: {
            id: `u${Date.now()}`,
            email: form.email,
            name: form.name,
            role,
            status: form.status,
          },
          phone: form.phone || null,
          position: form.position || null,
          joinedAt: new Date(2026, 2, 27).toISOString().split("T")[0],
        };
        setClubUsers([...clubUsers, newClubUser]);
      }
    }

    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "member") {
      setMembers(members.filter((m) => m.id !== deleteConfirm.id));
    } else {
      setClubUsers(clubUsers.filter((u) => u.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  }

  // ── Tabs config ────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; count: number; icon: React.ElementType }[] = [
    { key: "socios", label: "Socios", count: members.length, icon: Users },
    { key: "staff", label: "Staff", count: staffUsers.length, icon: UserCheck },
    { key: "admins", label: "Administradores", count: adminUsers.length, icon: Shield },
  ];

  const addLabels: Record<Tab, string> = {
    socios: "Nuevo socio",
    staff: "Nuevo staff",
    admins: "Nuevo admin",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {addLabels[activeTab]}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Buscar ${activeTab === "socios" ? "socio" : activeTab === "staff" ? "staff" : "admin"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Socios tab ──────────────────────────────────────────────────────── */}
      {activeTab === "socios" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Saldo</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Asignación/mes</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/members/${m.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.user.name} role="member" />
                        <span className="font-medium text-gray-900">{m.user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{m.user.email}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {m.creditBalance} cr
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {m.creditAllocationMonthly} cr/mes
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(m.user.status)}`}>
                        {getStatusLabel(m.user.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <PersonMenu
                        onEdit={() => openEditMember(m)}
                        onDelete={() => setDeleteConfirm({ type: "member", id: m.id, name: m.user.name })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No se encontraron socios</p>
          )}
        </div>
      )}

      {/* ── Staff tab ───────────────────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <ClubUserTable
          users={filteredStaff}
          emptyMsg="No se encontró staff"
          onEdit={openEditClubUser}
          onDelete={(u) => setDeleteConfirm({ type: "clubuser", id: u.id, name: u.user.name })}
        />
      )}

      {/* ── Admins tab ──────────────────────────────────────────────────────── */}
      {activeTab === "admins" && (
        <ClubUserTable
          users={filteredAdmins}
          emptyMsg="No se encontraron administradores"
          onEdit={openEditClubUser}
          onDelete={(u) => setDeleteConfirm({ type: "clubuser", id: u.id, name: u.user.name })}
        />
      )}

      {/* ── Add / Edit modal ────────────────────────────────────────────────── */}
      <Dialog.Root open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditTarget(null); setForm(EMPTY_FORM); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                {editTarget
                  ? "Editar persona"
                  : addLabels[activeTab]}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Formulario de persona
            </Dialog.Description>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                {/* Phone — only for staff/admins */}
                {activeTab !== "socios" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+51 987 000 000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                )}

                {/* Position — only for staff/admins */}
                {activeTab !== "socios" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      list="position-suggestions"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej. Recepcionista"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                    <datalist id="position-suggestions">
                      {POSITION_SUGGESTIONS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                )}

                {/* Credit allocation — only for socios */}
                {activeTab === "socios" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Créditos / mes</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.allocation}
                      onChange={(e) => setForm({ ...form, allocation: +e.target.value })}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as PersonForm["status"] })}
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Dialog.Close className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.email}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {editTarget ? "Guardar cambios" : "Agregar"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
      <Dialog.Root open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <Dialog.Title className="font-semibold text-gray-900">Eliminar persona</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  ¿Estás seguro que deseas eliminar a{" "}
                  <span className="font-medium text-gray-700">{deleteConfirm?.name}</span>? Esta acción no se puede deshacer.
                </Dialog.Description>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Dialog.Close className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ── ClubUser table (shared by Staff & Admins tabs) ────────────────────────────

function ClubUserTable({
  users,
  emptyMsg,
  onEdit,
  onDelete,
}: {
  users: ClubUser[];
  emptyMsg: string;
  onEdit: (u: ClubUser) => void;
  onDelete: (u: ClubUser) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Cargo</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Teléfono</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.user.name} role={u.user.role} />
                    <div>
                      <p className="font-medium text-gray-900">{u.user.name}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.user.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[u.user.role] ?? u.user.role}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">{u.user.email}</td>
                <td className="px-5 py-3 text-gray-600">{u.position ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3 text-gray-500">{u.phone ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(u.user.status)}`}>
                    {getStatusLabel(u.user.status)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <PersonMenu onEdit={() => onEdit(u)} onDelete={() => onDelete(u)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">{emptyMsg}</p>
      )}
    </div>
  );
}

// ── Row actions dropdown ──────────────────────────────────────────────────────

function PersonMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[140px] bg-white rounded-xl shadow-lg border border-gray-200 py-1 text-sm"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
            Editar
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
