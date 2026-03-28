/**
 * Zod validation schemas for all API endpoints.
 * Import and use with `schema.parse(body)` in route handlers.
 */
import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Contrasena requerida"),
});

export const registerSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  name: z.string().min(2, "Nombre muy corto").max(100),
  tenantId: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Minimo 8 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

// ── Courts ──────────────────────────────────────────────────────────────────

export const createCourtSchema = z.object({
  name: z.string().min(1).max(100),
  sport: z.enum(["padel", "tenis", "futbol", "squash", "pickleball", "frontenis", "otro"]).default("padel"),
  type: z.enum(["indoor", "outdoor", "covered"]),
  surface: z.string().min(1).max(100),
  capacity: z.number().int().min(1).max(50).default(4),
  sedeId: z.string().nullable().optional(),
});

export const updateCourtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sport: z.enum(["padel", "tenis", "futbol", "squash", "pickleball", "frontenis", "otro"]).optional(),
  type: z.enum(["indoor", "outdoor", "covered"]).optional(),
  surface: z.string().min(1).max(100).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  sedeId: z.string().nullable().optional(),
});

export const createBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().max(200).default(""),
});

// ── Bookings ────────────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  courtId: z.string().min(1),
  startTime: z.string().min(1, "startTime requerido"),
  endTime: z.string().min(1, "endTime requerido"),
});

export const staffBookingSchema = z.object({
  memberId: z.string().min(1),
  courtId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["completed", "no_show", "cancelled"]),
});

// ── Members ─────────────────────────────────────────────────────────────────

export const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  creditAllocationMonthly: z.number().int().min(0).default(0),
});

export const updateMemberSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  creditAllocationMonthly: z.number().int().min(0).optional(),
});

export const creditAdjustSchema = z.object({
  amount: z.number(),
  reason: z.string().min(1).max(200),
});

export const creditSaleSchema = z.object({
  amount: z.number().positive("Monto debe ser positivo"),
  pricePaid: z.number().min(0),
  paymentMethod: z.string().min(1),
  description: z.string().max(200).default(""),
});

// ── Sedes ───────────────────────────────────────────────────────────────────

export const createSedeSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(200).default(""),
  city: z.string().max(100).default(""),
});

export const updateSedeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
});

// ── Site/Branding ───────────────────────────────────────────────────────────

export const updateBrandingSchema = z.object({
  clubName: z.string().max(100).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().nullable().optional(),
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(200).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  instagram: z.string().max(100).optional(),
  hours: z.string().max(200).optional(),
  photos: z.array(z.string()).optional(),
});

// ── Platform ────────────────────────────────────────────────────────────────

export const createTenantSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  name: z.string().min(2).max(100),
  plan: z.enum(["starter", "pro", "business"]).default("starter"),
  customDomain: z.string().max(200).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(["starter", "pro", "business"]).optional(),
  status: z.enum(["active", "suspended", "trial"]).optional(),
  customDomain: z.string().max(200).nullable().optional(),
});

// ── Pagination helper ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginate<T>(items: T[], { page, limit }: Pagination): { data: T[]; total: number; page: number; limit: number; pages: number } {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total, page, limit, pages };
}
