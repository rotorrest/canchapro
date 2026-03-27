import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamp = () => text("created_at").default(sql`(datetime('now'))`).notNull();

// ── Tenants ──────────────────────────────────────────────────────────────────

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["starter", "pro", "business"] }).notNull().default("starter"),
  status: text("status", { enum: ["active", "suspended", "trial"] }).notNull().default("trial"),
  customDomain: text("custom_domain"),
  rateCardId: text("rate_card_id"),
  createdAt: timestamp(),
});

export const tenantBranding = sqliteTable("tenant_branding", {
  tenantId: text("tenant_id").primaryKey().references(() => tenants.id),
  clubName: text("club_name").notNull(),
  primaryColor: text("primary_color").notNull().default("#1d5092"),
  logoUrl: text("logo_url"),
  heroTitle: text("hero_title").default(""),
  heroSubtitle: text("hero_subtitle").default(""),
  address: text("address").default(""),
  phone: text("phone").default(""),
  instagram: text("instagram").default(""),
  hours: text("hours").default(""),
  photos: text("photos").default("[]"), // JSON array of R2 URLs
});

// ── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["platform_admin", "super_admin", "staff", "member"] }).notNull(),
  status: text("status", { enum: ["active", "suspended", "inactive"] }).notNull().default("active"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp(),
}, (t) => ({
  emailTenantIdx: uniqueIndex("idx_users_email_tenant").on(t.tenantId, t.email),
  tenantIdx: index("idx_users_tenant").on(t.tenantId),
}));

// ── Members ──────────────────────────────────────────────────────────────────

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  creditBalance: real("credit_balance").notNull().default(0),
  creditAllocationMonthly: integer("credit_allocation_monthly").notNull().default(0),
  lastBookingAt: text("last_booking_at"),
}, (t) => ({
  tenantIdx: index("idx_members_tenant").on(t.tenantId),
}));

// ── Sedes (locations) ───────────────────────────────────────────────────────

export const sedes = sqliteTable("sedes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  address: text("address").default(""),
  city: text("city").default(""),
  createdAt: timestamp(),
}, (t) => ({
  tenantIdx: index("idx_sedes_tenant").on(t.tenantId),
}));

// ── Courts ───────────────────────────────────────────────────────────────────

export const courts = sqliteTable("courts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  sedeId: text("sede_id").references(() => sedes.id),
  name: text("name").notNull(),
  sport: text("sport", { enum: ["padel", "tenis", "futbol", "squash", "pickleball", "frontenis", "otro"] }).notNull().default("padel"),
  type: text("type", { enum: ["indoor", "outdoor", "covered"] }).notNull(),
  surface: text("surface").notNull(),
  capacity: integer("capacity").notNull().default(4),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp(),
}, (t) => ({
  tenantIdx: index("idx_courts_tenant").on(t.tenantId),
}));

export const courtSchedules = sqliteTable("court_schedules", {
  id: text("id").primaryKey(),
  courtId: text("court_id").notNull().references(() => courts.id),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
}, (t) => ({
  courtDayIdx: uniqueIndex("idx_schedule_court_day").on(t.courtId, t.dayOfWeek),
}));

export const courtBlocks = sqliteTable("court_blocks", {
  id: text("id").primaryKey(),
  courtId: text("court_id").notNull().references(() => courts.id),
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason").default(""),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp(),
});

// ── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  memberId: text("member_id").notNull().references(() => members.id),
  courtId: text("court_id").notNull().references(() => courts.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  creditsDeducted: real("credits_deducted").notNull(),
  status: text("status", { enum: ["confirmed", "completed", "cancelled", "no_show"] }).notNull().default("confirmed"),
  cancelledAt: text("cancelled_at"),
  createdAt: timestamp(),
}, (t) => ({
  tenantIdx: index("idx_bookings_tenant").on(t.tenantId),
  courtTimeIdx: index("idx_bookings_court_time").on(t.courtId, t.startTime),
  memberIdx: index("idx_bookings_member").on(t.memberId),
}));

// ── Credits ──────────────────────────────────────────────────────────────────

export const creditPrices = sqliteTable("credit_prices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  slot: text("slot", { enum: ["morning", "afternoon", "evening"] }).notNull(),
  dayType: text("day_type", { enum: ["weekday", "weekend"] }).notNull(),
  price: real("price").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp(),
});

export const creditTransactions = sqliteTable("credit_transactions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  memberId: text("member_id").notNull().references(() => members.id),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["allocation", "deduction", "adjustment"] }).notNull(),
  reason: text("reason").default(""),
  bookingId: text("booking_id").references(() => bookings.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp(),
}, (t) => ({
  tenantIdx: index("idx_credit_tx_tenant").on(t.tenantId),
  memberIdx: index("idx_credit_tx_member").on(t.memberId),
}));

export const creditSales = sqliteTable("credit_sales", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  memberId: text("member_id").notNull().references(() => members.id),
  amount: real("amount").notNull(),
  pricePaid: real("price_paid").notNull(),
  paymentMethod: text("payment_method").notNull(),
  description: text("description").default(""),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp(),
});

// ── Rate Cards (billing) ─────────────────────────────────────────────────────

export const rateCards = sqliteTable("rate_cards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: timestamp(),
});

export const rateCardPlans = sqliteTable("rate_card_plans", {
  id: text("id").primaryKey(),
  rateCardId: text("rate_card_id").notNull().references(() => rateCards.id),
  plan: text("plan", { enum: ["starter", "pro", "business"] }).notNull(),
  basePrice: real("base_price").notNull(),
  feePerBooking: real("fee_per_booking").notNull(),
  freeBookings: integer("free_bookings").notNull().default(0),
  maxCourts: integer("max_courts"),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  period: text("period").notNull(),
  plan: text("plan").notNull(),
  basePrice: real("base_price").notNull(),
  bookingsCount: integer("bookings_count").notNull(),
  feePerBooking: real("fee_per_booking").notNull(),
  freeBookings: integer("free_bookings").notNull(),
  variableTotal: real("variable_total").notNull(),
  total: real("total").notNull(),
  rateCardId: text("rate_card_id").references(() => rateCards.id),
  rateCardName: text("rate_card_name").notNull(),
  addOnLineItems: text("add_on_line_items").default("[]"), // JSON: [{ addOnId, name, amount }]
  createdAt: timestamp(),
});

// ── Add-ons (marketplace) ───────────────────────────────────────────────────

export const addOns = sqliteTable("add_ons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("package"), // lucide icon name
  tier: text("tier", { enum: ["a", "b", "c", "d"] }).notNull().default("a"),
  priceType: text("price_type", { enum: ["flat_monthly", "per_unit", "percentage", "included"] }).notNull(),
  price: real("price").notNull(),
  availableOnPlans: text("available_on_plans").notNull().default('["starter","pro","business"]'), // JSON
  status: text("status", { enum: ["active", "beta", "deprecated"] }).notNull().default("active"),
  effectiveFrom: text("effective_from").notNull(),
  createdAt: timestamp(),
});

export const tenantAddOns = sqliteTable("tenant_add_ons", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  addOnId: text("add_on_id").notNull().references(() => addOns.id),
  priceOverride: real("price_override"), // null = use catalog price
  activatedAt: text("activated_at").notNull(),
  cancelledAt: text("cancelled_at"),
}, (t) => ({
  tenantIdx: index("idx_tenant_addons_tenant").on(t.tenantId),
  addOnIdx: index("idx_tenant_addons_addon").on(t.addOnId),
  uniqueActive: uniqueIndex("idx_tenant_addon_unique").on(t.tenantId, t.addOnId),
}));
