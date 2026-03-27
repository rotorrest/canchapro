// ── Types ─────────────────────────────────────────────────────────────────────

export type Role = "platform_admin" | "super_admin" | "staff" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: "active" | "suspended" | "inactive";
}

export interface Member {
  id: string;
  tenantId: string;
  user: User;
  creditBalance: number;
  creditAllocationMonthly: number;
  lastBookingAt: string | null;
}

export type CourtSport = "padel" | "tenis" | "futbol" | "squash" | "pickleball" | "frontenis" | "otro";

export interface CourtVersion {
  id: string;
  courtId: string;
  version: number;
  name: string;
  sport: CourtSport;
  type: "indoor" | "outdoor" | "covered";
  surface: string;
  capacity: number;
  priceMultiplier: number;
  createdAt: string;
  changedBy: string;
  reason: string;
}

export interface Sede {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
}

export interface Court {
  id: string;
  tenantId: string;
  sedeId: string | null; // null = sede unica / sin sedes
  isActive: boolean;
  versions: CourtVersion[];
}

export interface CourtSchedule {
  id: string;
  courtId: string;
  dayOfWeek: number; // 0=Lun … 6=Dom
  openTime: string;  // "HH:mm"
  closeTime: string; // "HH:mm"
  isClosed: boolean;
}

export interface CourtBlock {
  id: string;
  tenantId: string;
  scope: "tenant" | "sede" | "court";
  sedeId: string | null;
  courtId: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}

// ── Availability Config ──────────────────────────────────────────────────────

export interface AvailabilityConfig {
  tenantId: string;
  defaultSlotDuration: 30 | 60 | 90 | 120;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  maxBookingsPerMemberPerDay: number;
  bufferMinutes: number;
  noShowToleranceMinutes: number;
  autoCancelNoShow: boolean;
  bookingDeadlineTime: string | null;
}

export interface SpecialDay {
  id: string;
  tenantId: string;
  date: string;
  label: string;
  isClosed: boolean;
  scheduleOverrideId: string | null;
}

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;
  available: boolean;
  creditsCost: number;
  durationMinutes: number;
}

// ── Schedule system ──────────────────────────────────────────────────────────

export interface ScheduleTimeRange {
  id: string;
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  pricePerSlot: number; // créditos por bloque mínimo de reserva
}

export interface ScheduleDayConfig {
  dayOfWeek: number;        // 0=Lun ... 6=Dom
  isClosed: boolean;
  timeRanges: ScheduleTimeRange[];
}

export interface ScheduleVersion {
  id: string;
  scheduleId: string;
  version: number;
  slotDurationMinutes: number;       // 15, 30 o 60
  minBookingDurationMinutes: number; // duración mínima de reserva
  days: ScheduleDayConfig[];
  courtIds: string[];
  createdAt: string;
  changedBy: string;
  reason: string;
}

export interface Schedule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isActive: boolean;
  versions: ScheduleVersion[];
}

export interface Booking {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  courtId: string;
  courtVersionId: string;
  courtName: string;
  startTime: string; // ISO
  endTime: string;
  creditsDeducted: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  cancelledAt: string | null;
  createdAt: string;
}

export interface CreditPrice {
  id: string;
  tenantId: string;
  slot: "morning" | "afternoon" | "evening";
  dayType: "weekday" | "weekend";
  price: number;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  type: "allocation" | "deduction" | "adjustment";
  reason: string;
  bookingId: string | null;
  createdAt: string;
}

export interface MemberComment {
  id: string;
  tenantId: string;
  memberId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
  createdAt: string;
}

export interface CreditSale {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: "cash" | "yape" | "plin" | "transfer" | "pos";
  soldBy: string;
  createdAt: string;
}

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "bug" | "feature" | "billing" | "account" | "other";

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  createdById: string;
  createdByName: string;
  createdByRole: Role;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
  createdAt: string;
}

// ── Mock Users ────────────────────────────────────────────────────────────────

// ── Tenants (multi-club) ─────────────────────────────────────────────────────

export interface TenantBranding {
  primaryColor: string;   // hex e.g. "#1e3a8a"
  accentColor: string;    // hex e.g. "#3b82f6"
  logoUrl: string | null; // URL or null for default icon
  clubName: string;
}

export interface BillingPeriod {
  id: string;
  tenantId: string;
  month: string;           // "YYYY-MM"
  completedBookings: number;
  baseFee: number;          // S/ 99
  perBookingFee: number;    // S/ 0.50 × completedBookings
  total: number;
  status: "pending" | "invoiced" | "paid";
  invoicedAt: string | null;
  paidAt: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  courts: number;
  members: number;
  monthlyRevenue: number;
  status: "active" | "trial" | "suspended";
  plan: "starter" | "pro" | "club";
  branding: TenantBranding;
  createdAt: string;
}

export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: "#1e3a8a",
  accentColor: "#3b82f6",
  logoUrl: null,
  clubName: "Mi Club",
};

export const TENANTS: Tenant[] = [
  { id: "t1", name: "Ica Padel Club", slug: "ica-padel", city: "Ica", courts: 4, members: 87, monthlyRevenue: 15000, status: "active", plan: "starter", branding: { primaryColor: "#1e3a8a", accentColor: "#3b82f6", logoUrl: null, clubName: "Ica Padel Club" }, createdAt: "2026-01-15T00:00:00" },
  { id: "t2", name: "Lima Padel Center", slug: "lima-padel", city: "Lima", courts: 8, members: 210, monthlyRevenue: 42000, status: "active", plan: "pro", branding: { primaryColor: "#065f46", accentColor: "#10b981", logoUrl: null, clubName: "Lima Padel Center" }, createdAt: "2026-02-01T00:00:00" },
  { id: "t3", name: "Arequipa Smash", slug: "aqp-smash", city: "Arequipa", courts: 3, members: 45, monthlyRevenue: 8500, status: "trial", plan: "starter", branding: { primaryColor: "#7c2d12", accentColor: "#f97316", logoUrl: null, clubName: "Arequipa Smash" }, createdAt: "2026-03-10T00:00:00" },
  { id: "t4", name: "Trujillo Padel Club", slug: "trujillo-padel", city: "Trujillo", courts: 6, members: 130, monthlyRevenue: 25000, status: "active", plan: "pro", branding: { primaryColor: "#581c87", accentColor: "#a855f7", logoUrl: null, clubName: "Trujillo Padel Club" }, createdAt: "2026-02-20T00:00:00" },
  { id: "t5", name: "Cusco Sport Center", slug: "cusco-sport", city: "Cusco", courts: 2, members: 30, monthlyRevenue: 0, status: "suspended", plan: "starter", branding: { primaryColor: "#1e3a8a", accentColor: "#3b82f6", logoUrl: null, clubName: "Cusco Sport Center" }, createdAt: "2025-12-01T00:00:00" },
];

// ── Sedes (locations within a tenant) ─────────────────────────────────────────

export const SEDES: Sede[] = [
  // Ica Padel Club — sede unica (no necesita selector)
  { id: "s1", tenantId: "t1", name: "Sede principal", address: "Av. Los Maestros 123", city: "Ica" },

  // Lima Padel Center — 2 sedes
  { id: "s2", tenantId: "t2", name: "Lima Norte", address: "Av. Universitaria 456, Los Olivos", city: "Lima" },
  { id: "s3", tenantId: "t2", name: "Lima Sur", address: "Av. Primavera 789, Surco", city: "Lima" },
];

// ── User Directory (multi-tenant) ────────────────────────────────────────────

export interface UserCredential {
  email: string;
  password: string;
  user: User;
  tenantId: string | null; // null = platform admin
}

export const USER_DIRECTORY: UserCredential[] = [
  // Platform admin (Lumini)
  { email: "admin@lumini.dev", password: "admin123", tenantId: null, user: { id: "u0", email: "admin@lumini.dev", name: "Rodrigo Lumini", role: "platform_admin", status: "active" } },

  // Ica Padel Club (t1)
  { email: "admin@icapc.com", password: "admin123", tenantId: "t1", user: { id: "u1", email: "admin@icapc.com", name: "Carlos Mendoza", role: "super_admin", status: "active" } },
  { email: "staff@icapc.com", password: "admin123", tenantId: "t1", user: { id: "u2", email: "staff@icapc.com", name: "Ana Torres", role: "staff", status: "active" } },
  { email: "socio@icapc.com", password: "admin123", tenantId: "t1", user: { id: "u3", email: "socio@icapc.com", name: "Pedro Ramirez", role: "member", status: "active" } },

  // Lima Padel Center (t2)
  { email: "admin@limacp.com", password: "admin123", tenantId: "t2", user: { id: "u10", email: "admin@limacp.com", name: "Miguel Sanchez", role: "super_admin", status: "active" } },
  { email: "staff@limacp.com", password: "admin123", tenantId: "t2", user: { id: "u11", email: "staff@limacp.com", name: "Laura Diaz", role: "staff", status: "active" } },
  { email: "socio@limacp.com", password: "admin123", tenantId: "t2", user: { id: "u12", email: "socio@limacp.com", name: "Roberto Silva", role: "member", status: "active" } },
];

/** Authenticate by email/password */
export function authenticateUser(email: string, password: string): UserCredential | null {
  return USER_DIRECTORY.find((c) => c.email === email.trim().toLowerCase() && c.password === password) ?? null;
}

/** Find user credential by email only */
export function findUserByEmail(email: string): UserCredential | null {
  return USER_DIRECTORY.find((c) => c.email === email.trim().toLowerCase()) ?? null;
}

/** Get tenant by ID */
export function getTenantById(id: string): Tenant | undefined {
  return TENANTS.find((t) => t.id === id);
}

// ── Billing Periods ──────────────────────────────────────────────────────────

function billingPeriod(tenantId: string, month: string, bookings: number, status: BillingPeriod["status"], paidAt: string | null = null): BillingPeriod {
  const base = 99;
  const perBooking = Math.round(bookings * 0.5 * 100) / 100;
  return {
    id: `bp-${tenantId}-${month}`,
    tenantId,
    month,
    completedBookings: bookings,
    baseFee: base,
    perBookingFee: perBooking,
    total: base + perBooking,
    status,
    invoicedAt: status !== "pending" ? `${month}-01T00:00:00` : null,
    paidAt,
  };
}

export const BILLING_PERIODS: BillingPeriod[] = [
  // Ica Padel Club (t1)
  billingPeriod("t1", "2026-01", 980, "paid", "2026-02-05T00:00:00"),
  billingPeriod("t1", "2026-02", 1050, "paid", "2026-03-03T00:00:00"),
  billingPeriod("t1", "2026-03", 847, "pending"),
  // Lima Padel Center (t2)
  billingPeriod("t2", "2026-01", 2100, "paid", "2026-02-04T00:00:00"),
  billingPeriod("t2", "2026-02", 2340, "paid", "2026-03-02T00:00:00"),
  billingPeriod("t2", "2026-03", 1920, "pending"),
  // Arequipa Smash (t3) — trial, started March
  billingPeriod("t3", "2026-03", 310, "pending"),
  // Trujillo Padel Club (t4)
  billingPeriod("t4", "2026-02", 1600, "paid", "2026-03-05T00:00:00"),
  billingPeriod("t4", "2026-03", 1450, "invoiced"),
];

// ── Add-ons Catalog ─────────────────────────────────────────────────────────

export type AddOnPriceType = "flat_monthly" | "per_unit" | "percentage" | "included";
export type AddOnStatus = "active" | "beta" | "deprecated";
export type AddOnTier = "roi" | "ops" | "engagement" | "soon";

export interface AddOn {
  id: string;
  name: string;
  description: string;
  roiHint?: string;
  icon: string;
  tier: AddOnTier;
  priceType: AddOnPriceType;
  price: number;
  priceLabel: string;
  availableOnPlans: string[];
  status: AddOnStatus;
  category: string;
}

export interface Bundle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  addOnIds: string[];
  price: number;
  originalPrice: number;
  priceLabel: string;
  badgeLabel: string;
  badgeColor: string;
  icon: string;
  target: string;
}

export interface TenantAddOn {
  id: string;
  tenantId: string;
  addOnId: string;
  activatedAt: string;
  cancelledAt: string | null;
}

export const ADD_ONS_CATALOG: AddOn[] = [
  // ── Alto ROI — impacto directo en ingresos ────────────────────────────────
  {
    id: "ao1",
    name: "WhatsApp Recordatorios",
    description: "Recordatorio automático 2 horas antes de cada reserva. Reduce no-shows y recupera el ingreso perdido sin intervención del staff. Incluido en planes Pro y Business.",
    roiHint: "Clubs recuperan en promedio S/ 400+/mes en canchas que antes quedaban vacías.",
    icon: "message-circle",
    tier: "roi",
    priceType: "included",
    price: 0,
    priceLabel: "Incluido en Pro+",
    availableOnPlans: ["pro", "business"],
    status: "active",
    category: "Ocupacion",
  },
  {
    id: "ao10",
    name: "Lista de Espera",
    description: "Slot lleno = socio en lista. Si alguien cancela, el primero recibe WhatsApp automático. Tu cancha nunca duerme vacía.",
    roiHint: "Rellena el 60–80% de las cancelaciones de último minuto sin que el staff haga nada.",
    icon: "clock",
    tier: "roi",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["starter", "pro", "business"],
    status: "active",
    category: "Ocupacion",
  },
  {
    id: "ao2",
    name: "Link de Pago",
    description: "Genera un link Yape, Plin o Culqi desde el panel y envíalo por WhatsApp. El socio paga, sus créditos se acreditan solos.",
    roiHint: "Elimina el 100% del seguimiento manual de pagos por transferencia.",
    icon: "link",
    tier: "roi",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["starter", "pro", "business"],
    status: "active",
    category: "Cobros",
  },
  {
    id: "ao12",
    name: "Split de Cancha",
    description: "El que reserva manda un link y cada jugador paga su parte. Ideal para pádel: siempre son 4, nadie quiere pagar todo.",
    roiHint: "Más reservas completadas porque la barrera de pago se reparte entre todos.",
    icon: "split",
    tier: "roi",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["starter", "pro", "business"],
    status: "active",
    category: "Cobros",
  },
  // ── Operacion — eficiencia operativa ─────────────────────────────────────
  {
    id: "ao3",
    name: "Pagos In-App",
    description: "Tus socios compran créditos directo desde la app con Culqi o Mercado Pago. Cero intervención del staff, cobro 24/7.",
    icon: "credit-card",
    tier: "ops",
    priceType: "percentage",
    price: 2.5,
    priceLabel: "2% por transacción",
    availableOnPlans: ["pro", "business"],
    status: "active",
    category: "Cobros",
  },
  {
    id: "ao11",
    name: "Clases y Coaches",
    description: "Horarios de coaches, reserva de clases grupales e individuales, comisiones automáticas. Tus socios reservan clases igual que una cancha.",
    roiHint: "Monetiza las horas muertas. Una academia de 3 coaches puede generar S/ 5,000+/mes adicionales.",
    icon: "graduation-cap",
    tier: "ops",
    priceType: "flat_monthly",
    price: 89,
    priceLabel: "S/ 89/mes",
    availableOnPlans: ["pro", "business"],
    status: "active",
    category: "Operacion",
  },
  {
    id: "ao4",
    name: "Multi-sede",
    description: "2+ ubicaciones en un solo panel. Canchas separadas por sede, reportes consolidados, un login para todo el equipo.",
    icon: "map-pin",
    tier: "ops",
    priceType: "flat_monthly",
    price: 49,
    priceLabel: "S/ 49/sede adicional",
    availableOnPlans: ["pro", "business"],
    status: "active",
    category: "Operacion",
  },
  {
    id: "ao17",
    name: "Dominio Personalizado",
    description: "app.tuclub.pe en lugar de tuclub.canchapro.com. SSL automático. Tu marca en la URL, no la nuestra.",
    icon: "globe",
    tier: "ops",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Operacion",
  },
  {
    id: "ao9",
    name: "RFID",
    description: "Tarjetas RFID con el logo del club. El celular del staff actúa como lector. Packs de 100 tarjetas, diseño provisto por el club.",
    icon: "scan-line",
    tier: "ops",
    priceType: "flat_monthly",
    price: 150,
    priceLabel: "S/ 150/mes + tarjetas",
    availableOnPlans: ["starter", "pro", "business"],
    status: "beta",
    category: "Operacion",
  },
  {
    id: "ao16",
    name: "Reportes SUNAT",
    description: "Boletas y facturas electrónicas generadas automáticamente al vender créditos. Exporta reportes para tu contador con un clic.",
    icon: "file-text",
    tier: "ops",
    priceType: "flat_monthly",
    price: 49,
    priceLabel: "S/ 49/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Cobros",
  },
  // ── Engagement — retención y crecimiento ─────────────────────────────────
  {
    id: "ao5",
    name: "Comunicaciones",
    description: "Emails y notificaciones push a todos tus socios con un clic. Anuncia torneos, promociones, cambios de horario. Incluye banners en la pantalla de reserva.",
    icon: "mail",
    tier: "engagement",
    priceType: "flat_monthly",
    price: 49,
    priceLabel: "S/ 49/mes · 2,000 envíos",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  {
    id: "ao13",
    name: "Busco Jugador",
    description: "\"Tengo cancha el sábado 10am, busco 4to nivel 3.\" Matchmaking entre socios del club. Más partidos reservados, más uso de la app.",
    roiHint: "Clubs con matchmaking ven +20% de reservas completadas vs. las canceladas por falta de jugadores.",
    icon: "handshake",
    tier: "engagement",
    priceType: "flat_monthly",
    price: 39,
    priceLabel: "S/ 39/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  {
    id: "ao14",
    name: "Ranking de Socios",
    description: "ELO interno del club. Los socios ven su posición después de cada partido. Alta retención: nadie abandona un club donde está en el top 10.",
    icon: "star",
    tier: "engagement",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  {
    id: "ao15",
    name: "Fidelización",
    description: "Puntos por cada reserva, canjeables por créditos. \"Juega 10 veces, la 11va es gratis.\" Retención automática, sin gestión manual.",
    roiHint: "Aumenta la frecuencia de reserva promedio un 25–30% en los primeros 3 meses.",
    icon: "gift",
    tier: "engagement",
    priceType: "flat_monthly",
    price: 49,
    priceLabel: "S/ 49/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  {
    id: "ao8",
    name: "Referidos",
    description: "Tu socio comparte un link. Su amigo se registra. Ambos reciben créditos. Tu mejor canal de adquisición ya está en el club.",
    roiHint: "El costo de adquisición por referido es 5–10× menor que cualquier publicidad externa.",
    icon: "users",
    tier: "engagement",
    priceType: "flat_monthly",
    price: 29,
    priceLabel: "S/ 29/mes",
    availableOnPlans: ["starter", "pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  // ── Próximamente ─────────────────────────────────────────────────────────
  {
    id: "ao7",
    name: "Torneos",
    description: "Crea brackets, abre inscripciones y haz seguimiento de resultados en tiempo real. Todo integrado con reservas y créditos.",
    roiHint: "Un torneo mensual puede llenar todas tus canchas un fin de semana completo.",
    icon: "trophy",
    tier: "soon",
    priceType: "flat_monthly",
    price: 79,
    priceLabel: "S/ 79/mes",
    availableOnPlans: ["pro", "business"],
    status: "beta",
    category: "Engagement",
  },
  // Deprecated — merged into Comunicaciones
  {
    id: "ao6",
    name: "Publicidad Interna",
    description: "Fusionado con Comunicaciones.",
    icon: "megaphone",
    tier: "soon",
    priceType: "flat_monthly",
    price: 0,
    priceLabel: "",
    availableOnPlans: [],
    status: "deprecated",
    category: "Engagement",
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b1",
    name: "Pack Ocupación Máxima",
    tagline: "Llena tus canchas todos los días",
    description: "Lista de Espera rellena cancellaciones automáticamente. Combinado con WhatsApp Recordatorios (incluido en Pro+), maximiza tu ocupación.",
    addOnIds: ["ao10"],
    price: 29,
    originalPrice: 29,
    priceLabel: "S/ 29/mes",
    badgeLabel: "Más popular",
    badgeColor: "bg-emerald-100 text-emerald-700",
    icon: "trending-up",
    target: "Clubs Pro+ que quieren maximizar ocupación con lista de espera automática",
  },
  {
    id: "b2",
    name: "Pack Cobros Sin Fricción",
    tagline: "Cobra más rápido, sin perseguir a nadie",
    description: "Link de Pago para cobrar créditos por WhatsApp + Split de Cancha para que cada jugador pague su parte. Cero seguimiento manual.",
    addOnIds: ["ao2", "ao12"],
    price: 49,
    originalPrice: 58,
    priceLabel: "S/ 49/mes",
    badgeLabel: "Alto ROI",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: "wallet",
    target: "Clubs que cobran por transferencia o en efectivo",
  },
  {
    id: "b3",
    name: "Pack Comunidad Activa",
    tagline: "Tu club crece solo",
    description: "Matchmaking para llenar canchas, Ranking para enganchar a los socios y Referidos para crecer sin gastar en publicidad.",
    addOnIds: ["ao13", "ao14", "ao8"],
    price: 79,
    originalPrice: 97,
    priceLabel: "S/ 79/mes",
    badgeLabel: "Crecimiento",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: "users",
    target: "Clubs con base de socios activa que quieren escalar",
  },
  {
    id: "b4",
    name: "Pack Academia",
    tagline: "Monetiza cada hora del día",
    description: "Clases y Coaches para gestionar tu academia + Torneos para llenar el club los fines de semana. El combo para clubs con ambiciones.",
    addOnIds: ["ao11", "ao7"],
    price: 149,
    originalPrice: 168,
    priceLabel: "S/ 149/mes",
    badgeLabel: "Premium",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: "graduation-cap",
    target: "Clubs con coaches o academia de pádel",
  },
];

export const TENANT_ADD_ONS: TenantAddOn[] = [
  // Ica Padel Club (t1) — starter plan, has Link de Pago
  { id: "ta1", tenantId: "t1", addOnId: "ao2", activatedAt: "2026-02-15T00:00:00", cancelledAt: null },
  // Lima Padel Center (t2) — pro plan, WhatsApp included in plan, has Pagos + Multi-sede
  { id: "ta3", tenantId: "t2", addOnId: "ao3", activatedAt: "2026-02-01T00:00:00", cancelledAt: null },
  { id: "ta4", tenantId: "t2", addOnId: "ao4", activatedAt: "2026-03-01T00:00:00", cancelledAt: null },
  // Trujillo Padel Club (t4) — pro plan, WhatsApp included in plan
];

// ── Club Users (staff & admins) ───────────────────────────────────────────────

export interface ClubUser {
  id: string;
  tenantId: string;
  user: User;
  phone: string | null;
  position: string | null;
  joinedAt: string;
}

export const CLUB_USERS: ClubUser[] = [
  // ── Ica Padel Club (t1) — admins ──────────────────────────────────────────
  {
    id: "cu1", tenantId: "t1",
    user: USER_DIRECTORY[1].user, // Carlos Mendoza, super_admin
    phone: "+51 987 000 001", position: "Director general", joinedAt: "2024-11-01",
  },
  {
    id: "cu2", tenantId: "t1",
    user: { id: "u21", email: "manager@icapc.com", name: "Sofia Vargas", role: "super_admin", status: "active" },
    phone: "+51 987 000 002", position: "Gerente de operaciones", joinedAt: "2025-02-01",
  },
  // ── Ica Padel Club (t1) — staff ───────────────────────────────────────────
  {
    id: "cu3", tenantId: "t1",
    user: USER_DIRECTORY[2].user, // Ana Torres, staff
    phone: "+51 987 000 003", position: "Recepcionista", joinedAt: "2025-01-10",
  },
  {
    id: "cu4", tenantId: "t1",
    user: { id: "u22", email: "coach1@icapc.com", name: "Luis Herrera", role: "staff", status: "active" },
    phone: "+51 987 000 004", position: "Instructor de padel", joinedAt: "2025-03-15",
  },
  {
    id: "cu5", tenantId: "t1",
    user: { id: "u23", email: "maint@icapc.com", name: "Jorge Quispe", role: "staff", status: "active" },
    phone: "+51 987 000 005", position: "Mantenimiento", joinedAt: "2025-05-20",
  },
  {
    id: "cu6", tenantId: "t1",
    user: { id: "u24", email: "coach2@icapc.com", name: "Valeria Ruiz", role: "staff", status: "suspended" },
    phone: "+51 987 000 006", position: "Instructora de tenis", joinedAt: "2025-07-01",
  },
  // ── Lima Padel Center (t2) — admins ───────────────────────────────────────
  {
    id: "cu7", tenantId: "t2",
    user: USER_DIRECTORY[4].user, // Miguel Sanchez, super_admin
    phone: "+51 987 000 010", position: "Director general", joinedAt: "2025-01-01",
  },
  // ── Lima Padel Center (t2) — staff ────────────────────────────────────────
  {
    id: "cu8", tenantId: "t2",
    user: USER_DIRECTORY[5].user, // Laura Diaz, staff
    phone: "+51 987 000 011", position: "Recepcionista", joinedAt: "2025-02-15",
  },
  {
    id: "cu9", tenantId: "t2",
    user: { id: "u30", email: "coach@limacp.com", name: "Diego Flores", role: "staff", status: "active" },
    phone: "+51 987 000 012", position: "Instructor jefe", joinedAt: "2025-04-01",
  },
];

// Legacy compat — keep MOCK_USERS for pages that still reference it
export const MOCK_USERS: Record<Role, User> = {
  platform_admin: USER_DIRECTORY[0].user,
  super_admin: USER_DIRECTORY[1].user,
  staff: USER_DIRECTORY[2].user,
  member: USER_DIRECTORY[3].user,
};

// ── Courts ────────────────────────────────────────────────────────────────────

export const COURTS: Court[] = [
  {
    id: "c1",
    tenantId: "t1",
    sedeId: "s1",
    isActive: true,
    versions: [
      { id: "cv1", courtId: "c1", version: 1, name: "Court 1", sport: "padel", type: "indoor", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-01-01T00:00:00", changedBy: "Carlos Mendoza", reason: "Creacion inicial" },
    ],
  },
  {
    id: "c2",
    tenantId: "t1",
    sedeId: "s1",
    isActive: true,
    versions: [
      { id: "cv2", courtId: "c2", version: 1, name: "Court 2", sport: "padel", type: "indoor", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-01-01T00:00:00", changedBy: "Carlos Mendoza", reason: "Creacion inicial" },
      { id: "cv2b", courtId: "c2", version: 2, name: "Court 2", sport: "padel", type: "indoor", surface: "Césped sintético premium", capacity: 4, priceMultiplier: 1.5, createdAt: "2026-03-15T00:00:00", changedBy: "Ana Torres", reason: "Cambio de superficie por desgaste" },
    ],
  },
  {
    id: "c3",
    tenantId: "t1",
    sedeId: "s1",
    isActive: true,
    versions: [
      { id: "cv3", courtId: "c3", version: 1, name: "Court 3", sport: "padel", type: "covered", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-01-01T00:00:00", changedBy: "Carlos Mendoza", reason: "Creacion inicial" },
    ],
  },
  {
    id: "c4",
    tenantId: "t1",
    sedeId: "s1",
    isActive: false,
    versions: [
      { id: "cv4", courtId: "c4", version: 1, name: "Court 4", sport: "padel", type: "outdoor", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-01-01T00:00:00", changedBy: "Carlos Mendoza", reason: "Creacion inicial" },
    ],
  },
  // Lima Padel Center (t2)
  {
    id: "lc1",
    tenantId: "t2",
    sedeId: "s2",
    isActive: true,
    versions: [
      { id: "lcv1", courtId: "lc1", version: 1, name: "Cancha Central", sport: "padel", type: "indoor", surface: "Cristal", capacity: 4, priceMultiplier: 1.2, createdAt: "2026-02-01T00:00:00", changedBy: "Miguel Sanchez", reason: "Creacion inicial" },
    ],
  },
  {
    id: "lc2",
    tenantId: "t2",
    sedeId: "s2",
    isActive: true,
    versions: [
      { id: "lcv2", courtId: "lc2", version: 1, name: "Cancha Norte", sport: "padel", type: "indoor", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-02-01T00:00:00", changedBy: "Miguel Sanchez", reason: "Creacion inicial" },
    ],
  },
  {
    id: "lc3",
    tenantId: "t2",
    sedeId: "s3",
    isActive: true,
    versions: [
      { id: "lcv3", courtId: "lc3", version: 1, name: "Cancha Sur", sport: "padel", type: "covered", surface: "Césped artificial", capacity: 4, priceMultiplier: 1, createdAt: "2026-02-01T00:00:00", changedBy: "Miguel Sanchez", reason: "Creacion inicial" },
    ],
  },
  {
    id: "lc4",
    tenantId: "t2",
    sedeId: "s3",
    isActive: true,
    versions: [
      { id: "lcv4", courtId: "lc4", version: 1, name: "Cancha VIP", sport: "padel", type: "indoor", surface: "Cristal", capacity: 4, priceMultiplier: 1.5, createdAt: "2026-02-01T00:00:00", changedBy: "Miguel Sanchez", reason: "Creacion inicial" },
    ],
  },
];

/** Get the current (latest) version of a court */
export function getCurrentVersion(court: Court): CourtVersion {
  return court.versions[court.versions.length - 1];
}

// ── Court Schedules (operating hours per court per day) ──────────────────────

function defaultSchedule(courtId: string): CourtSchedule[] {
  const days = [0, 1, 2, 3, 4, 5, 6]; // Lun–Dom
  return days.map((d) => ({
    id: `cs-${courtId}-${d}`,
    courtId,
    dayOfWeek: d,
    openTime: d >= 5 ? "07:00" : "06:00",  // fines de semana abren a las 7
    closeTime: "22:00",
    isClosed: false,
  }));
}

export const COURT_SCHEDULES: CourtSchedule[] = [
  ...defaultSchedule("c1"),
  ...defaultSchedule("c2"),
  ...defaultSchedule("c3"),
  ...defaultSchedule("c4").map((s) => ({ ...s, isClosed: true })), // Court 4 esta inactiva
  // Lima Padel Center (t2)
  ...defaultSchedule("lc1"),
  ...defaultSchedule("lc2"),
  ...defaultSchedule("lc3"),
  ...defaultSchedule("lc4"),
];

// ── Court Blocks (one-off closures) ──────────────────────────────────────────

export const COURT_BLOCKS: CourtBlock[] = [
  // Court-level blocks
  { id: "cb1", tenantId: "t1", scope: "court", sedeId: null, courtId: "c1", date: "2026-03-30", startTime: null, endTime: null, reason: "Mantenimiento programado" },
  { id: "cb2", tenantId: "t1", scope: "court", sedeId: null, courtId: "c2", date: "2026-04-01", startTime: "14:00", endTime: "18:00", reason: "Evento privado" },
  // Tenant-level block (all courts, all sedes)
  { id: "cb3", tenantId: "t1", scope: "tenant", sedeId: null, courtId: null, date: "2026-05-01", startTime: null, endTime: null, reason: "Feriado - Dia del Trabajo" },
  // Sede-level block
  { id: "cb4", tenantId: "t2", scope: "sede", sedeId: "s2", courtId: null, date: "2026-04-05", startTime: null, endTime: null, reason: "Fumigacion sede Norte" },
  // Court-level block Lima
  { id: "lcb1", tenantId: "t2", scope: "court", sedeId: null, courtId: "lc1", date: "2026-04-02", startTime: "10:00", endTime: "14:00", reason: "Torneo interno" },
];

// ── Availability Configs ─────────────────────────────────────────────────────

export const AVAILABILITY_CONFIGS: AvailabilityConfig[] = [
  {
    tenantId: "t1",
    defaultSlotDuration: 60,
    minAdvanceMinutes: 120,
    maxAdvanceDays: 60,
    maxBookingsPerMemberPerDay: 2,
    bufferMinutes: 0,
    noShowToleranceMinutes: 15,
    autoCancelNoShow: false,
    bookingDeadlineTime: null,
  },
  {
    tenantId: "t2",
    defaultSlotDuration: 60,
    minAdvanceMinutes: 60,
    maxAdvanceDays: 30,
    maxBookingsPerMemberPerDay: 3,
    bufferMinutes: 10,
    noShowToleranceMinutes: 10,
    autoCancelNoShow: true,
    bookingDeadlineTime: "20:00",
  },
];

// ── Special Days ─────────────────────────────────────────────────────────────

export const SPECIAL_DAYS: SpecialDay[] = [
  { id: "sd1", tenantId: "t1", date: "2026-05-01", label: "Dia del Trabajo", isClosed: true, scheduleOverrideId: null },
  { id: "sd2", tenantId: "t1", date: "2026-07-28", label: "Fiestas Patrias", isClosed: true, scheduleOverrideId: null },
  { id: "sd3", tenantId: "t1", date: "2026-04-20", label: "Torneo interclub", isClosed: false, scheduleOverrideId: "sch2" },
  { id: "sd4", tenantId: "t2", date: "2026-05-01", label: "Dia del Trabajo", isClosed: true, scheduleOverrideId: null },
  { id: "sd5", tenantId: "t2", date: "2026-07-28", label: "Fiestas Patrias", isClosed: true, scheduleOverrideId: null },
];

export function getAvailabilityConfig(tenantId: string): AvailabilityConfig {
  return AVAILABILITY_CONFIGS.find((c) => c.tenantId === tenantId) ?? {
    tenantId,
    defaultSlotDuration: 60,
    minAdvanceMinutes: 120,
    maxAdvanceDays: 60,
    maxBookingsPerMemberPerDay: 2,
    bufferMinutes: 0,
    noShowToleranceMinutes: 15,
    autoCancelNoShow: false,
    bookingDeadlineTime: null,
  };
}

export function getBlocksForCourt(courtId: string, date: string, tenantId: string, sedeId: string | null): CourtBlock[] {
  return COURT_BLOCKS.filter((b) => {
    if (b.date !== date) return false;
    if (b.scope === "tenant" && b.tenantId === tenantId) return true;
    if (b.scope === "sede" && b.sedeId === sedeId) return true;
    if (b.scope === "court" && b.courtId === courtId) return true;
    return false;
  });
}

// ── Members ───────────────────────────────────────────────────────────────────

export const MEMBERS: Member[] = [
  {
    id: "m1",
    tenantId: "t1",
    user: MOCK_USERS.member,
    creditBalance: 32,
    creditAllocationMonthly: 50,
    lastBookingAt: "2026-03-24T18:00:00",
  },
  {
    id: "m2",
    tenantId: "t1",
    user: { id: "u4", email: "lucia@gmail.com", name: "Lucía Fernández", role: "member", status: "active" },
    creditBalance: 45,
    creditAllocationMonthly: 50,
    lastBookingAt: "2026-03-25T08:00:00",
  },
  {
    id: "m3",
    tenantId: "t1",
    user: { id: "u5", email: "jorge@gmail.com", name: "Jorge Castillo", role: "member", status: "active" },
    creditBalance: 12,
    creditAllocationMonthly: 30,
    lastBookingAt: "2026-03-20T10:00:00",
  },
  {
    id: "m4",
    tenantId: "t1",
    user: { id: "u6", email: "maria@gmail.com", name: "María López", role: "member", status: "suspended" },
    creditBalance: 0,
    creditAllocationMonthly: 50,
    lastBookingAt: null,
  },
  {
    id: "m5",
    tenantId: "t1",
    user: { id: "u7", email: "diego@gmail.com", name: "Diego Herrera", role: "member", status: "active" },
    creditBalance: 50,
    creditAllocationMonthly: 50,
    lastBookingAt: null,
  },
  // Lima Padel Center (t2)
  {
    id: "lm1",
    tenantId: "t2",
    user: USER_DIRECTORY[6].user,
    creditBalance: 40,
    creditAllocationMonthly: 60,
    lastBookingAt: "2026-03-26T10:00:00",
  },
  {
    id: "lm2",
    tenantId: "t2",
    user: { id: "u13", email: "carolina@gmail.com", name: "Carolina Vega", role: "member", status: "active" },
    creditBalance: 55,
    creditAllocationMonthly: 60,
    lastBookingAt: "2026-03-25T18:00:00",
  },
  {
    id: "lm3",
    tenantId: "t2",
    user: { id: "u14", email: "fernando@gmail.com", name: "Fernando Rojas", role: "member", status: "active" },
    creditBalance: 20,
    creditAllocationMonthly: 40,
    lastBookingAt: null,
  },
];

// ── Credit Prices ─────────────────────────────────────────────────────────────

export const CREDIT_PRICES: CreditPrice[] = [
  { id: "cp1", tenantId: "t1", slot: "morning", dayType: "weekday", price: 1 },
  { id: "cp2", tenantId: "t1", slot: "morning", dayType: "weekend", price: 1.5 },
  { id: "cp3", tenantId: "t1", slot: "afternoon", dayType: "weekday", price: 1.5 },
  { id: "cp4", tenantId: "t1", slot: "afternoon", dayType: "weekend", price: 2 },
  { id: "cp5", tenantId: "t1", slot: "evening", dayType: "weekday", price: 2 },
  { id: "cp6", tenantId: "t1", slot: "evening", dayType: "weekend", price: 2.5 },
  // Lima Padel Center (t2)
  { id: "lcp1", tenantId: "t2", slot: "morning", dayType: "weekday", price: 1.5 },
  { id: "lcp2", tenantId: "t2", slot: "morning", dayType: "weekend", price: 2 },
  { id: "lcp3", tenantId: "t2", slot: "afternoon", dayType: "weekday", price: 2 },
  { id: "lcp4", tenantId: "t2", slot: "afternoon", dayType: "weekend", price: 2.5 },
  { id: "lcp5", tenantId: "t2", slot: "evening", dayType: "weekday", price: 2.5 },
  { id: "lcp6", tenantId: "t2", slot: "evening", dayType: "weekend", price: 3 },
];

// ── Schedules ─────────────────────────────────────────────────────────────────

function makeDay(dow: number, isClosed: boolean, ranges: [string, string, number][]): ScheduleDayConfig {
  return {
    dayOfWeek: dow,
    isClosed,
    timeRanges: ranges.map((r, i) => ({
      id: `str-${dow}-${i}`,
      startTime: r[0],
      endTime: r[1],
      pricePerSlot: r[2],
    })),
  };
}

const weekdayRangesT1: [string, string, number][] = [
  ["06:00", "12:00", 1],
  ["12:00", "18:00", 1.5],
  ["18:00", "22:00", 2],
];
const weekendRangesT1: [string, string, number][] = [
  ["07:00", "12:00", 1.5],
  ["12:00", "18:00", 2],
  ["18:00", "22:00", 2.5],
];
const weekdayRangesT2: [string, string, number][] = [
  ["06:00", "12:00", 1.5],
  ["12:00", "18:00", 2],
  ["18:00", "22:00", 2.5],
];
const weekendRangesT2: [string, string, number][] = [
  ["07:00", "12:00", 2],
  ["12:00", "18:00", 2.5],
  ["18:00", "22:00", 3],
];

export const SCHEDULES: Schedule[] = [
  {
    id: "sch1",
    tenantId: "t1",
    name: "Horario regular",
    description: "Horario estándar para todas las canchas",
    isActive: true,
    versions: [
      {
        id: "schv1",
        scheduleId: "sch1",
        version: 1,
        slotDurationMinutes: 60,
        minBookingDurationMinutes: 60,
        courtIds: ["c1", "c2", "c3"],
        days: [
          makeDay(0, false, weekdayRangesT1),
          makeDay(1, false, weekdayRangesT1),
          makeDay(2, false, weekdayRangesT1),
          makeDay(3, false, weekdayRangesT1),
          makeDay(4, false, weekdayRangesT1),
          makeDay(5, false, weekendRangesT1),
          makeDay(6, false, weekendRangesT1),
        ],
        createdAt: "2025-01-01T00:00:00",
        changedBy: "Carlos Mendoza",
        reason: "Horario inicial",
      },
    ],
  },
  {
    id: "sch2",
    tenantId: "t1",
    name: "Horario verano",
    description: "Horario extendido para temporada de verano",
    isActive: false,
    versions: [
      {
        id: "schv2",
        scheduleId: "sch2",
        version: 1,
        slotDurationMinutes: 60,
        minBookingDurationMinutes: 60,
        courtIds: ["c1", "c2", "c3"],
        days: [
          makeDay(0, false, [["07:00", "12:00", 1], ["12:00", "18:00", 1.5], ["18:00", "23:00", 2]]),
          makeDay(1, false, [["07:00", "12:00", 1], ["12:00", "18:00", 1.5], ["18:00", "23:00", 2]]),
          makeDay(2, false, [["07:00", "12:00", 1], ["12:00", "18:00", 1.5], ["18:00", "23:00", 2]]),
          makeDay(3, false, [["07:00", "12:00", 1], ["12:00", "18:00", 1.5], ["18:00", "23:00", 2]]),
          makeDay(4, false, [["07:00", "12:00", 1], ["12:00", "18:00", 1.5], ["18:00", "23:00", 2]]),
          makeDay(5, false, [["08:00", "12:00", 1.5], ["12:00", "18:00", 2], ["18:00", "23:00", 2.5]]),
          makeDay(6, false, [["08:00", "12:00", 1.5], ["12:00", "18:00", 2], ["18:00", "23:00", 2.5]]),
        ],
        createdAt: "2025-12-15T00:00:00",
        changedBy: "Carlos Mendoza",
        reason: "Preparación temporada verano 2026",
      },
    ],
  },
  {
    id: "sch3",
    tenantId: "t2",
    name: "Horario Lima",
    description: "Horario estándar Lima Padel Center",
    isActive: true,
    versions: [
      {
        id: "schv3",
        scheduleId: "sch3",
        version: 1,
        slotDurationMinutes: 60,
        minBookingDurationMinutes: 60,
        courtIds: ["lc1", "lc2", "lc3", "lc4"],
        days: [
          makeDay(0, false, weekdayRangesT2),
          makeDay(1, false, weekdayRangesT2),
          makeDay(2, false, weekdayRangesT2),
          makeDay(3, false, weekdayRangesT2),
          makeDay(4, false, weekdayRangesT2),
          makeDay(5, false, weekendRangesT2),
          makeDay(6, false, weekendRangesT2),
        ],
        createdAt: "2025-02-01T00:00:00",
        changedBy: "Miguel Sanchez",
        reason: "Horario inicial",
      },
    ],
  },
];

/** Find the active schedule that contains a given court */
export function getActiveScheduleForCourt(courtId: string): Schedule | null {
  return SCHEDULES.find(
    (s) => s.isActive && getCurrentScheduleVersion(s).courtIds.includes(courtId)
  ) ?? null;
}

/** Get the latest version of a schedule */
export function getCurrentScheduleVersion(schedule: Schedule): ScheduleVersion {
  return schedule.versions.reduce((a, b) => (a.version > b.version ? a : b));
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export const BOOKINGS: Booking[] = [
  {
    id: "b1",
    tenantId: "t1",
    memberId: "m1",
    memberName: "Pedro Ramirez",
    courtId: "c1",
    courtVersionId: "cv1",
    courtName: "Court 1",
    startTime: "2026-03-27T08:00:00",
    endTime: "2026-03-27T09:00:00",
    creditsDeducted: 1,
    status: "confirmed",
    cancelledAt: null,

    createdAt: "2026-03-25T14:00:00",
  },
  {
    id: "b2",
    tenantId: "t1",
    memberId: "m1",
    memberName: "Pedro Ramirez",
    courtId: "c2",
    courtVersionId: "cv2",
    courtName: "Court 2",
    startTime: "2026-03-28T18:00:00",
    endTime: "2026-03-28T19:00:00",
    creditsDeducted: 2.5,
    status: "confirmed",
    cancelledAt: null,

    createdAt: "2026-03-25T15:00:00",
  },
  {
    id: "b3",
    tenantId: "t1",
    memberId: "m2",
    memberName: "Lucía Fernández",
    courtId: "c1",
    courtVersionId: "cv1",
    courtName: "Court 1",
    startTime: "2026-03-27T10:00:00",
    endTime: "2026-03-27T11:00:00",
    creditsDeducted: 1,
    status: "confirmed",
    cancelledAt: null,

    createdAt: "2026-03-26T09:00:00",
  },
  {
    id: "b4",
    tenantId: "t1",
    memberId: "m3",
    memberName: "Jorge Castillo",
    courtId: "c3",
    courtVersionId: "cv3",
    courtName: "Court 3",
    startTime: "2026-03-24T14:00:00",
    endTime: "2026-03-24T15:00:00",
    creditsDeducted: 1.5,
    status: "completed",
    cancelledAt: null,

    createdAt: "2026-03-22T11:00:00",
  },
  {
    id: "b5",
    tenantId: "t1",
    memberId: "m1",
    memberName: "Pedro Ramirez",
    courtId: "c3",
    courtVersionId: "cv3",
    courtName: "Court 3",
    startTime: "2026-03-22T18:00:00",
    endTime: "2026-03-22T19:00:00",
    creditsDeducted: 2,
    status: "cancelled",
    cancelledAt: "2026-03-22T10:00:00",

    createdAt: "2026-03-20T16:00:00",
  },
  {
    id: "b6",
    tenantId: "t1",
    memberId: "m3",
    memberName: "Jorge Castillo",
    courtId: "c1",
    courtVersionId: "cv1",
    courtName: "Court 1",
    startTime: "2026-03-25T16:00:00",
    endTime: "2026-03-25T17:00:00",
    creditsDeducted: 1.5,
    status: "no_show",
    cancelledAt: null,
    createdAt: "2026-03-23T09:00:00",
  },
  // Lima Padel Center (t2)
  {
    id: "lb1",
    tenantId: "t2",
    memberId: "lm1",
    memberName: "Roberto Silva",
    courtId: "lc1",
    courtVersionId: "lcv1",
    courtName: "Cancha Central",
    startTime: "2026-03-27T10:00:00",
    endTime: "2026-03-27T11:00:00",
    creditsDeducted: 1.8,
    status: "confirmed",
    cancelledAt: null,
    createdAt: "2026-03-25T09:00:00",
  },
  {
    id: "lb2",
    tenantId: "t2",
    memberId: "lm2",
    memberName: "Carolina Vega",
    courtId: "lc4",
    courtVersionId: "lcv4",
    courtName: "Cancha VIP",
    startTime: "2026-03-28T18:00:00",
    endTime: "2026-03-28T19:00:00",
    creditsDeducted: 3.75,
    status: "confirmed",
    cancelledAt: null,
    createdAt: "2026-03-26T14:00:00",
  },
  {
    id: "lb3",
    tenantId: "t2",
    memberId: "lm1",
    memberName: "Roberto Silva",
    courtId: "lc2",
    courtVersionId: "lcv2",
    courtName: "Cancha Norte",
    startTime: "2026-03-24T08:00:00",
    endTime: "2026-03-24T09:00:00",
    creditsDeducted: 1.5,
    status: "completed",
    cancelledAt: null,
    createdAt: "2026-03-22T10:00:00",
  },
];

// ── Transactions ──────────────────────────────────────────────────────────────

export const TRANSACTIONS: CreditTransaction[] = [
  { id: "t1", tenantId: "t1", memberId: "m1", amount: 50, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
  { id: "t2", tenantId: "t1", memberId: "m1", amount: -1, type: "deduction", reason: "Reserva Court 1", bookingId: "b1", createdAt: "2026-03-25T14:00:00" },
  { id: "t3", tenantId: "t1", memberId: "m1", amount: -2.5, type: "deduction", reason: "Reserva Court 2", bookingId: "b2", createdAt: "2026-03-25T15:00:00" },
  { id: "t4", tenantId: "t1", memberId: "m1", amount: -2, type: "deduction", reason: "Reserva Court 3", bookingId: "b5", createdAt: "2026-03-20T16:00:00" },
  { id: "t6", tenantId: "t1", memberId: "m1", amount: -15, type: "deduction", reason: "Varias reservas", bookingId: null, createdAt: "2026-03-15T10:00:00" },
  { id: "t7", tenantId: "t1", memberId: "m1", amount: 0.5, type: "adjustment", reason: "Correccion por admin", bookingId: null, createdAt: "2026-03-10T09:00:00" },
  { id: "t8", tenantId: "t1", memberId: "m2", amount: 50, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
  { id: "t9", tenantId: "t1", memberId: "m2", amount: -1, type: "deduction", reason: "Reserva Court 1", bookingId: "b3", createdAt: "2026-03-26T09:00:00" },
  { id: "t10", tenantId: "t1", memberId: "m2", amount: -4, type: "deduction", reason: "Varias reservas", bookingId: null, createdAt: "2026-03-12T08:00:00" },
  { id: "t11", tenantId: "t1", memberId: "m3", amount: 30, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
  { id: "t12", tenantId: "t1", memberId: "m3", amount: -1.5, type: "deduction", reason: "Reserva Court 3", bookingId: "b4", createdAt: "2026-03-22T11:00:00" },
  { id: "t13", tenantId: "t1", memberId: "m3", amount: -16.5, type: "deduction", reason: "Varias reservas", bookingId: null, createdAt: "2026-03-10T08:00:00" },
  { id: "t14", tenantId: "t1", memberId: "m5", amount: 50, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
  // Lima Padel Center (t2)
  { id: "lt1", tenantId: "t2", memberId: "lm1", amount: 60, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
  { id: "lt2", tenantId: "t2", memberId: "lm1", amount: -1.8, type: "deduction", reason: "Reserva Cancha Central", bookingId: "lb1", createdAt: "2026-03-25T09:00:00" },
  { id: "lt3", tenantId: "t2", memberId: "lm2", amount: 60, type: "allocation", reason: "Asignacion mensual", bookingId: null, createdAt: "2026-03-01T00:01:00" },
];

// ── Member Comments ──────────────────────────────────────────────────────────

export const MEMBER_COMMENTS: MemberComment[] = [
  { id: "mc1", tenantId: "t1", memberId: "m1", authorId: "u1", authorName: "Carlos Mendoza", authorRole: "super_admin", text: "Excelente socio, siempre puntual y respetuoso con las instalaciones.", createdAt: "2026-03-20T10:00:00" },
  { id: "mc2", tenantId: "t1", memberId: "m1", authorId: "u2", authorName: "Ana Torres", authorRole: "staff", text: "Solicito cambio de horario para su reserva del viernes. Se le atendio sin problema.", createdAt: "2026-03-22T14:30:00" },
  { id: "mc3", tenantId: "t1", memberId: "m2", authorId: "u1", authorName: "Carlos Mendoza", authorRole: "super_admin", text: "Nueva socia referida por Pedro Ramirez. Juega nivel intermedio.", createdAt: "2026-03-18T09:00:00" },
  { id: "mc4", tenantId: "t1", memberId: "m3", authorId: "u2", authorName: "Ana Torres", authorRole: "staff", text: "Reporto problema con la iluminacion de Court 3 durante su reserva.", createdAt: "2026-03-21T16:00:00" },
  { id: "mc5", tenantId: "t1", memberId: "m4", authorId: "u1", authorName: "Carlos Mendoza", authorRole: "super_admin", text: "Suspendida por falta de pago. Contactar para regularizar situacion.", createdAt: "2026-03-15T11:00:00" },
  // Lima Padel Center (t2)
  { id: "lmc1", tenantId: "t2", memberId: "lm1", authorId: "u10", authorName: "Miguel Sanchez", authorRole: "super_admin", text: "Socio frecuente, siempre reserva la Cancha Central", createdAt: "2026-03-20T10:00:00" },
];

// ── Credit Sales ─────────────────────────────────────────────────────────────

export const CREDIT_SALES: CreditSale[] = [
  { id: "cs1", tenantId: "t1", memberId: "m1", memberName: "Pedro Ramirez", amount: 50, paymentMethod: "yape", soldBy: "Ana Torres", createdAt: "2026-03-01T08:30:00" },
  { id: "cs2", tenantId: "t1", memberId: "m2", memberName: "Lucía Fernández", amount: 50, paymentMethod: "transfer", soldBy: "Ana Torres", createdAt: "2026-03-01T09:00:00" },
  { id: "cs3", tenantId: "t1", memberId: "m3", memberName: "Jorge Castillo", amount: 30, paymentMethod: "cash", soldBy: "Carlos Mendoza", createdAt: "2026-03-01T09:30:00" },
  { id: "cs4", tenantId: "t1", memberId: "m1", memberName: "Pedro Ramirez", amount: 20, paymentMethod: "plin", soldBy: "Ana Torres", createdAt: "2026-03-15T10:00:00" },
  { id: "cs5", tenantId: "t1", memberId: "m5", memberName: "Diego Herrera", amount: 50, paymentMethod: "pos", soldBy: "Carlos Mendoza", createdAt: "2026-03-02T11:00:00" },
  { id: "cs6", tenantId: "t1", memberId: "m2", memberName: "Lucía Fernández", amount: 25, paymentMethod: "yape", soldBy: "Ana Torres", createdAt: "2026-03-18T14:00:00" },
  // Lima Padel Center (t2)
  { id: "lcs1", tenantId: "t2", memberId: "lm1", memberName: "Roberto Silva", amount: 60, paymentMethod: "yape", soldBy: "Laura Diaz", createdAt: "2026-03-01T10:00:00" },
  { id: "lcs2", tenantId: "t2", memberId: "lm2", memberName: "Carolina Vega", amount: 60, paymentMethod: "transfer", soldBy: "Miguel Sanchez", createdAt: "2026-03-01T11:00:00" },
];

// ── Support Tickets ──────────────────────────────────────────────────────────

export const SUPPORT_TICKETS: SupportTicket[] = [
  { id: "st1", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u1", createdByName: "Carlos Mendoza", createdByRole: "super_admin", subject: "Error al generar reporte mensual", description: "Al intentar exportar el reporte de creditos del mes de febrero, el sistema muestra un error 500. Ya intente en diferentes navegadores.", category: "bug", priority: "high", status: "open", assignedTo: null, createdAt: "2026-03-25T10:00:00", updatedAt: "2026-03-25T10:00:00" },
  { id: "st2", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u2", createdByName: "Ana Torres", createdByRole: "staff", subject: "Solicitud de modulo de torneos", description: "Nos gustaria poder organizar torneos desde la plataforma. Necesitamos brackets, inscripciones y resultados.", category: "feature", priority: "medium", status: "in_progress", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-20T14:00:00", updatedAt: "2026-03-22T09:00:00" },
  { id: "st3", tenantId: "t2", tenantName: "Lima Padel Center", createdById: "u1", createdByName: "Miguel Sanchez", createdByRole: "super_admin", subject: "Problema con cobros duplicados", description: "Dos socios reportaron que se les cobro doble en sus creditos al hacer reservas el fin de semana.", category: "billing", priority: "urgent", status: "open", assignedTo: null, createdAt: "2026-03-26T08:00:00", updatedAt: "2026-03-26T08:00:00" },
  { id: "st4", tenantId: "t1", tenantName: "Ica Padel Club", createdById: "u1", createdByName: "Carlos Mendoza", createdByRole: "super_admin", subject: "Agregar segundo admin al sistema", description: "Necesito que mi socio tambien tenga acceso de administrador. Su correo es socio@icapadelclub.pe.", category: "account", priority: "low", status: "resolved", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-10T16:00:00", updatedAt: "2026-03-12T10:00:00" },
  { id: "st5", tenantId: "t4", tenantName: "Trujillo Padel Club", createdById: "u2", createdByName: "Rosa Diaz", createdByRole: "staff", subject: "QR de socios no escanea", description: "Desde ayer los codigos QR de los socios no se pueden escanear. La camara abre pero no reconoce el codigo.", category: "bug", priority: "high", status: "in_progress", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-24T09:00:00", updatedAt: "2026-03-25T11:00:00" },
  { id: "st6", tenantId: "t3", tenantName: "Arequipa Smash", createdById: "u1", createdByName: "Luis Paredes", createdByRole: "super_admin", subject: "Consulta sobre plan Pro", description: "Estamos interesados en migrar del plan Starter al Pro. Que incluye y cual es el proceso?", category: "billing", priority: "low", status: "closed", assignedTo: "Rodrigo Lumini", createdAt: "2026-03-05T12:00:00", updatedAt: "2026-03-07T15:00:00" },
];

export const TICKET_MESSAGES: TicketMessage[] = [
  { id: "tm1", ticketId: "st1", authorId: "u1", authorName: "Carlos Mendoza", authorRole: "super_admin", text: "Adjunto captura del error. Ocurre solo con el reporte de febrero.", createdAt: "2026-03-25T10:05:00" },
  { id: "tm2", ticketId: "st2", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "Gracias por la sugerencia, Ana. El modulo de torneos esta en nuestro roadmap para Q2. Te mantendre informada del avance.", createdAt: "2026-03-22T09:00:00" },
  { id: "tm3", ticketId: "st2", authorId: "u2", authorName: "Ana Torres", authorRole: "staff", text: "Genial! Los socios lo piden mucho. Si necesitan feedback de usuarios, con gusto ayudo.", createdAt: "2026-03-22T11:00:00" },
  { id: "tm4", ticketId: "st4", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "Listo, Carlos. Ya agregue a tu socio como admin. Puede ingresar con su correo y la contrasena temporal que le envie.", createdAt: "2026-03-12T10:00:00" },
  { id: "tm5", ticketId: "st5", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "Estamos investigando el problema. Parece ser un issue con la libreria de generacion de QR. Daremos una solucion hoy.", createdAt: "2026-03-25T11:00:00" },
  { id: "tm6", ticketId: "st6", authorId: "u0", authorName: "Rodrigo Lumini", authorRole: "platform_admin", text: "El plan Pro incluye hasta 8 canchas, reportes avanzados, y soporte prioritario. Te envio los detalles por correo.", createdAt: "2026-03-06T09:00:00" },
  { id: "tm7", ticketId: "st6", authorId: "u1", authorName: "Luis Paredes", authorRole: "super_admin", text: "Perfecto, revisare el correo. Gracias por la info.", createdAt: "2026-03-06T14:00:00" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCourtTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    indoor: "Indoor",
    outdoor: "Outdoor",
    covered: "Techado",
  };
  return labels[type] ?? type;
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    padel: "Pádel",
    tenis: "Tenis",
    futbol: "Fútbol",
    squash: "Squash",
    pickleball: "Pickleball",
    frontenis: "Frontenis",
    otro: "Otro",
  };
  return labels[sport] ?? sport;
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    padel: "🏓",
    tenis: "🎾",
    futbol: "⚽",
    squash: "🏸",
    pickleball: "🏓",
    frontenis: "🎾",
    otro: "🏟️",
  };
  return emojis[sport] ?? "🏟️";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-red-100 text-red-700",
    inactive: "bg-gray-100 text-gray-600",
    confirmed: "bg-blue-100 text-blue-900",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-gray-100 text-gray-600",
    open: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-600",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return colors[priority] ?? "bg-gray-100 text-gray-600";
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[priority] ?? priority;
}

export function getTicketStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Abierto",
    in_progress: "En progreso",
    resolved: "Resuelto",
    closed: "Cerrado",
  };
  return labels[status] ?? status;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    bug: "Error",
    feature: "Mejora",
    billing: "Facturacion",
    account: "Cuenta",
    other: "Otro",
  };
  return labels[category] ?? category;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Efectivo",
    yape: "Yape",
    plin: "Plin",
    transfer: "Transferencia",
    pos: "POS",
  };
  return labels[method] ?? method;
}

/** Find a member by their user ID */
export function getMemberByUserId(userId: string): Member | undefined {
  return MEMBERS.find((m) => m.user.id === userId);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "\u25CF Activo",
    suspended: "\u25B2 Suspendido",
    inactive: "\u25CB Inactivo",
    confirmed: "\u25CF Confirmada",
    in_progress: "\u25B6 En curso",
    completed: "\u2713 Completada",
    cancelled: "\u2715 Cancelada",
    no_show: "\u25CB No asistio",
  };
  return labels[status] ?? status;
}

/** Compute display status for a booking: detects "in_progress" from current time */
export function getBookingDisplayStatus(booking: Booking): string {
  if (booking.status === "cancelled" || booking.status === "no_show") return booking.status;
  if (booking.status === "completed") return "completed";

  // booking.status === "confirmed" — check if it's happening now
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  if (now >= start && now < end) return "in_progress";
  if (now >= end) return "completed"; // auto-complete past bookings
  return "confirmed";
}

/** Generate availability slots for a given date and court, using the current version's priceMultiplier */
/** Helper: format minutes to "HH:mm" */
function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Helper: "HH:mm" to total minutes */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function generateSlots(date: Date, courtId: string): TimeSlot[] {
  const court = COURTS.find((c) => c.id === courtId);
  const version = court ? getCurrentVersion(court) : undefined;
  const multiplier = version?.priceMultiplier ?? 1;

  const jsDay = date.getDay();
  const ourDay = jsDay === 0 ? 6 : jsDay - 1;

  const dateStr = date.toISOString().split("T")[0];
  const tenantId = court?.tenantId ?? "";
  const sedeId = court?.sedeId ?? null;
  const dayBlocks = getBlocksForCourt(courtId, dateStr, tenantId, sedeId);
  const isFullDayBlocked = dayBlocks.some((b) => !b.startTime && !b.endTime);
  if (isFullDayBlocked) return [];

  // ── Try schedule-based generation ──────────────────────────────────────────
  const activeSchedule = getActiveScheduleForCourt(courtId);
  if (activeSchedule) {
    const sv = getCurrentScheduleVersion(activeSchedule);
    const dayConfig = sv.days.find((d) => d.dayOfWeek === ourDay);
    if (!dayConfig || dayConfig.isClosed) return [];

    const slotDur = sv.minBookingDurationMinutes;
    const slots: TimeSlot[] = [];

    for (const range of dayConfig.timeRanges) {
      const rangeStart = hhmmToMinutes(range.startTime);
      const rangeEnd = hhmmToMinutes(range.endTime);

      for (let min = rangeStart; min + slotDur <= rangeEnd; min += slotDur) {
        const startStr = minutesToHHMM(min);
        const endStr = minutesToHHMM(min + slotDur);
        const startISO = `${dateStr}T${startStr}:00`;

        const booked = BOOKINGS.some(
          (b) => b.courtId === courtId && b.status === "confirmed" && b.startTime === startISO
        );

        const blocked = dayBlocks.some((b) => {
          if (!b.startTime || !b.endTime) return false;
          return startStr >= b.startTime && startStr < b.endTime;
        });

        slots.push({
          startTime: startStr,
          endTime: endStr,
          available: !booked && !blocked,
          creditsCost: Math.round(range.pricePerSlot * multiplier * 10) / 10,
          durationMinutes: slotDur,
        });
      }
    }
    return slots;
  }

  // ── Fallback: legacy CourtSchedule + CreditPrice ───────────────────────────
  const schedule = COURT_SCHEDULES.find(
    (s) => s.courtId === courtId && s.dayOfWeek === ourDay
  );
  if (schedule?.isClosed) return [];

  const openHour = schedule ? parseInt(schedule.openTime.split(":")[0], 10) : 6;
  const closeHour = schedule ? parseInt(schedule.closeTime.split(":")[0], 10) : 22;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const dayType = isWeekend ? "weekend" : "weekday";
  const slots: TimeSlot[] = [];

  for (let hour = openHour; hour < closeHour; hour++) {
    let slot: "morning" | "afternoon" | "evening";
    if (hour < 12) slot = "morning";
    else if (hour < 18) slot = "afternoon";
    else slot = "evening";

    const price = CREDIT_PRICES.find((p) => p.slot === slot && p.dayType === dayType)!;
    const startISO = `${dateStr}T${String(hour).padStart(2, "0")}:00:00`;
    const hourStr = `${String(hour).padStart(2, "0")}:00`;
    const endHourStr = `${String(hour + 1).padStart(2, "0")}:00`;

    const booked = BOOKINGS.some(
      (b) => b.courtId === courtId && b.status === "confirmed" && b.startTime === startISO
    );

    const blocked = dayBlocks.some((b) => {
      if (!b.startTime || !b.endTime) return false;
      return hourStr >= b.startTime && hourStr < b.endTime;
    });

    slots.push({
      startTime: hourStr,
      endTime: endHourStr,
      available: !booked && !blocked,
      creditsCost: Math.round(price.price * multiplier * 10) / 10,
      durationMinutes: 60,
    });
  }

  return slots;
}
