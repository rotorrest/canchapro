import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const platform = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// All platform routes require platform_admin
platform.use("/*", authMiddleware);
platform.use("/*", requireRole("platform_admin"));

// ── Tenants ─────────────────────────────────────────────────────────────────

// GET /tenants — list all
platform.get("/tenants", async (c) => {
  const db = createDb(c.env.DB);

  const tenants = await db.query.tenants.findMany();
  const brandings = await db.query.tenantBranding.findMany();

  const brandingMap = new Map(brandings.map((b) => [b.tenantId, b]));

  return c.json({
    data: tenants.map((t) => ({
      ...t,
      branding: brandingMap.get(t.id) ?? null,
    })),
  });
});

// GET /tenants/:id
platform.get("/tenants/:id", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, id),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const branding = await db.query.tenantBranding.findFirst({
    where: eq(schema.tenantBranding.tenantId, id),
  });

  return c.json({ data: { ...tenant, branding: branding ?? null } });
});

// POST /tenants — create
platform.post("/tenants", async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    slug: string; name: string; plan?: string; customDomain?: string;
  }>();

  const id = crypto.randomUUID();

  await db.insert(schema.tenants).values({
    id,
    slug: body.slug.toLowerCase(),
    name: body.name,
    plan: (body.plan as "starter" | "pro" | "business") ?? "starter",
    status: "trial",
  });

  await db.insert(schema.tenantBranding).values({
    tenantId: id,
    clubName: body.name,
  });

  // Cache in KV for fast tenant resolution
  await c.env.TENANT_KV.put(`tenant:${body.slug.toLowerCase()}`, JSON.stringify({ id }));

  if (body.customDomain) {
    await db.update(schema.tenants)
      .set({ customDomain: body.customDomain })
      .where(eq(schema.tenants.id, id));
    await c.env.TENANT_KV.put(`domain:${body.customDomain}`, body.slug.toLowerCase());
  }

  const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, id) });
  return c.json({ data: tenant }, 201);
});

// PUT /tenants/:id — update
platform.put("/tenants/:id", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json<{
    name?: string; plan?: string; status?: string; customDomain?: string;
  }>();

  const existing = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, id),
  });
  if (!existing) return c.json({ error: "Tenant not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name;
  if (body.plan) updates.plan = body.plan;
  if (body.status) updates.status = body.status;

  if (body.customDomain !== undefined) {
    // Remove old domain mapping from KV
    if (existing.customDomain) {
      await c.env.TENANT_KV.delete(`domain:${existing.customDomain}`);
    }
    updates.customDomain = body.customDomain;
    if (body.customDomain) {
      await c.env.TENANT_KV.put(`domain:${body.customDomain}`, existing.slug);
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.update(schema.tenants).set(updates).where(eq(schema.tenants.id, id));
  }

  const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, id) });
  return c.json({ data: tenant });
});

// ── Billing ─────────────────────────────────────────────────────────────────

// GET /billing — list invoices
platform.get("/billing", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.req.query("tenantId");

  let result;
  if (tenantId) {
    result = await db.query.invoices.findMany({
      where: eq(schema.invoices.tenantId, tenantId),
    });
  } else {
    result = await db.query.invoices.findMany();
  }

  return c.json({ data: result });
});

// POST /billing/invoices — generate invoice for a tenant+period
platform.post("/billing/invoices", async (c) => {
  const db = createDb(c.env.DB);
  const { tenantId, period } = await c.req.json<{ tenantId: string; period: string }>();

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  // Resolve rate card plan
  let rateCardPlan;
  if (tenant.rateCardId) {
    rateCardPlan = await db.query.rateCardPlans.findFirst({
      where: and(
        eq(schema.rateCardPlans.rateCardId, tenant.rateCardId),
        eq(schema.rateCardPlans.plan, tenant.plan)
      ),
    });
  }

  if (!rateCardPlan) {
    const defaultCard = await db.query.rateCards.findFirst({
      where: eq(schema.rateCards.isDefault, true),
    });
    if (defaultCard) {
      rateCardPlan = await db.query.rateCardPlans.findFirst({
        where: and(
          eq(schema.rateCardPlans.rateCardId, defaultCard.id),
          eq(schema.rateCardPlans.plan, tenant.plan)
        ),
      });
    }
  }

  if (!rateCardPlan) return c.json({ error: "No rate card found" }, 400);

  // Count bookings in period (format: "2026-03")
  const allBookings = await db.query.bookings.findMany({
    where: eq(schema.bookings.tenantId, tenantId),
  });
  const periodBookings = allBookings.filter((b) => b.createdAt.startsWith(period));
  const bookingsCount = periodBookings.length;

  const billableBookings = Math.max(0, bookingsCount - rateCardPlan.freeBookings);
  const variableTotal = billableBookings * rateCardPlan.feePerBooking;
  const total = rateCardPlan.basePrice + variableTotal;

  const rateCard = await db.query.rateCards.findFirst({
    where: eq(schema.rateCards.id, rateCardPlan.rateCardId),
  });

  // Calculate add-on line items
  const activeAddOns = await db.query.tenantAddOns.findMany({
    where: eq(schema.tenantAddOns.tenantId, tenantId),
  });
  const addOnLineItems: { addOnId: string; name: string; amount: number }[] = [];
  let addOnTotal = 0;

  for (const ta of activeAddOns) {
    if (ta.cancelledAt) continue;
    const addOn = await db.query.addOns.findFirst({
      where: eq(schema.addOns.id, ta.addOnId),
    });
    if (!addOn) continue;

    const price = ta.priceOverride ?? addOn.price;
    let amount = 0;

    if (addOn.priceType === "flat_monthly") {
      amount = price;
    } else if (addOn.priceType === "per_unit") {
      amount = price * bookingsCount;
    } else if (addOn.priceType === "percentage") {
      amount = Math.round((price / 100) * (rateCardPlan.basePrice + variableTotal) * 100) / 100;
    }

    addOnLineItems.push({ addOnId: addOn.id, name: addOn.name, amount });
    addOnTotal += amount;
  }

  const totalWithAddOns = rateCardPlan.basePrice + variableTotal + addOnTotal;

  const id = crypto.randomUUID();
  await db.insert(schema.invoices).values({
    id,
    tenantId,
    period,
    plan: tenant.plan,
    basePrice: rateCardPlan.basePrice,
    bookingsCount,
    feePerBooking: rateCardPlan.feePerBooking,
    freeBookings: rateCardPlan.freeBookings,
    variableTotal,
    total: totalWithAddOns,
    rateCardId: rateCardPlan.rateCardId,
    rateCardName: rateCard?.name ?? "Default",
    addOnLineItems: JSON.stringify(addOnLineItems),
  });

  const invoice = await db.query.invoices.findFirst({ where: eq(schema.invoices.id, id) });
  return c.json({ data: invoice }, 201);
});

// ── Add-on Catalog ──────────────────────────────────────────────────────────

// GET /addons — list catalog
platform.get("/addons", async (c) => {
  const db = createDb(c.env.DB);
  const addons = await db.query.addOns.findMany();

  // Count active tenants per add-on
  const tenantAddOns = await db.query.tenantAddOns.findMany();
  const activeCounts = new Map<string, number>();
  for (const ta of tenantAddOns) {
    if (!ta.cancelledAt) {
      activeCounts.set(ta.addOnId, (activeCounts.get(ta.addOnId) ?? 0) + 1);
    }
  }

  return c.json({
    data: addons.map((a) => ({
      ...a,
      availableOnPlans: JSON.parse(a.availableOnPlans),
      activeTenants: activeCounts.get(a.id) ?? 0,
    })),
  });
});

// POST /addons — create add-on
platform.post("/addons", async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    name: string; description: string; icon?: string; tier?: string;
    priceType: string; price: number; availableOnPlans?: string[];
    status?: string; effectiveFrom: string;
  }>();

  const id = crypto.randomUUID();
  await db.insert(schema.addOns).values({
    id,
    name: body.name,
    description: body.description,
    icon: body.icon ?? "package",
    tier: (body.tier as "a" | "b" | "c" | "d") ?? "a",
    priceType: body.priceType as "flat_monthly" | "per_unit" | "percentage",
    price: body.price,
    availableOnPlans: JSON.stringify(body.availableOnPlans ?? ["starter", "pro", "business"]),
    status: (body.status as "active" | "beta" | "deprecated") ?? "active",
    effectiveFrom: body.effectiveFrom,
  });

  const addon = await db.query.addOns.findFirst({ where: eq(schema.addOns.id, id) });
  return c.json({ data: addon }, 201);
});

// PUT /addons/:id — update add-on
platform.put("/addons/:id", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json();

  const existing = await db.query.addOns.findFirst({ where: eq(schema.addOns.id, id) });
  if (!existing) return c.json({ error: "Add-on not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name;
  if (body.description) updates.description = body.description;
  if (body.icon) updates.icon = body.icon;
  if (body.tier) updates.tier = body.tier;
  if (body.priceType) updates.priceType = body.priceType;
  if (body.price !== undefined) updates.price = body.price;
  if (body.availableOnPlans) updates.availableOnPlans = JSON.stringify(body.availableOnPlans);
  if (body.status) updates.status = body.status;

  if (Object.keys(updates).length > 0) {
    await db.update(schema.addOns).set(updates).where(eq(schema.addOns.id, id));
  }

  const addon = await db.query.addOns.findFirst({ where: eq(schema.addOns.id, id) });
  return c.json({ data: addon });
});

// GET /tenants/:id/addons — list tenant's active add-ons
platform.get("/tenants/:id/addons", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const active = await db.query.tenantAddOns.findMany({
    where: eq(schema.tenantAddOns.tenantId, id),
  });

  return c.json({ data: active });
});

// POST /tenants/:id/addons — activate add-on for tenant
platform.post("/tenants/:id/addons", async (c) => {
  const db = createDb(c.env.DB);
  const { id: tenantId } = c.req.param();
  const { addOnId, priceOverride } = await c.req.json<{ addOnId: string; priceOverride?: number }>();

  const taId = crypto.randomUUID();
  await db.insert(schema.tenantAddOns).values({
    id: taId,
    tenantId,
    addOnId,
    priceOverride: priceOverride ?? null,
    activatedAt: new Date().toISOString(),
  });

  const result = await db.query.tenantAddOns.findFirst({ where: eq(schema.tenantAddOns.id, taId) });
  return c.json({ data: result }, 201);
});

export default platform;
