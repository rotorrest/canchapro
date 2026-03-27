// ── Auth ──────────────────────────────────────────────────────────────────────

export type Role = "platform_admin" | "super_admin" | "staff" | "member";

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  role: Role;
  status: "active" | "suspended" | "inactive";
  createdAt: string;
}

export interface AuthTokenPayload {
  sub: string; // user id
  tid: string | null; // tenant id
  role: Role;
  iat: number;
  exp: number;
}

// ── Tenants ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: "starter" | "pro" | "business";
  status: "active" | "suspended" | "trial";
  customDomain: string | null;
  rateCardId: string | null;
  createdAt: string;
}

export interface TenantBranding {
  clubName: string;
  primaryColor: string;
  logoUrl: string | null;
  heroTitle: string;
  heroSubtitle: string;
  address: string;
  phone: string;
  instagram: string;
  hours: string;
  photos: string[];
}

// ── Sedes ───────────────────────────────────────────────────────────────────

export interface Sede {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  createdAt: string;
}

// ── Courts ───────────────────────────────────────────────────────────────────

export interface Court {
  id: string;
  tenantId: string;
  sedeId: string | null;
  name: string;
  sport: "padel" | "tenis" | "futbol" | "squash" | "pickleball" | "frontenis" | "otro";
  type: "indoor" | "outdoor" | "covered";
  surface: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface CourtSchedule {
  id: string;
  courtId: string;
  dayOfWeek: number; // 0=Mon … 6=Sun
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface CourtBlock {
  id: string;
  courtId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

// ── Members ──────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  tenantId: string;
  userId: string;
  creditBalance: number;
  creditAllocationMonthly: number;
  lastBookingAt: string | null;
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  tenantId: string;
  memberId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  creditsDeducted: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  cancelledAt: string | null;
  createdAt: string;
}

// ── Credits ──────────────────────────────────────────────────────────────────

export interface CreditPrice {
  id: string;
  tenantId: string;
  slot: "morning" | "afternoon" | "evening";
  dayType: "weekday" | "weekend";
  price: number;
  effectiveFrom: string;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  type: "allocation" | "deduction" | "adjustment";
  reason: string;
  bookingId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreditSale {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  pricePaid: number;
  paymentMethod: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

// ── Rate Cards (billing) ─────────────────────────────────────────────────────

export interface RateCard {
  id: string;
  name: string;
  effectiveFrom: string;
  isDefault: boolean;
}

export interface RateCardPlan {
  id: string;
  rateCardId: string;
  plan: "starter" | "pro" | "business";
  basePrice: number;
  feePerBooking: number;
  freeBookings: number;
  maxCourts: number | null;
}

// ── Add-ons ─────────────────────────────────────────────────────────────────

export interface AddOn {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "a" | "b" | "c" | "d";
  priceType: "flat_monthly" | "per_unit" | "percentage" | "included";
  price: number;
  availableOnPlans: string[]; // ["starter", "pro", "business"]
  status: "active" | "beta" | "deprecated";
  effectiveFrom: string;
  createdAt: string;
}

export interface TenantAddOn {
  id: string;
  tenantId: string;
  addOnId: string;
  priceOverride: number | null;
  activatedAt: string;
  cancelledAt: string | null;
}

export interface AddOnLineItem {
  addOnId: string;
  name: string;
  amount: number;
}

// ── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
