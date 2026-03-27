import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const marketplace = new Hono<{ Bindings: Bindings; Variables: Variables }>();

marketplace.use("/*", authMiddleware);
marketplace.use("/*", requireRole("super_admin"));

// GET /catalog — browse available add-ons for this tenant's plan
marketplace.get("/catalog", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const allAddOns = await db.query.addOns.findMany();
  const tenantAddOns = await db.query.tenantAddOns.findMany({
    where: eq(schema.tenantAddOns.tenantId, tenantId),
  });

  const activeMap = new Map(
    tenantAddOns
      .filter((ta) => !ta.cancelledAt)
      .map((ta) => [ta.addOnId, ta])
  );

  const catalog = allAddOns
    .filter((a) => a.status !== "deprecated")
    .filter((a) => {
      const plans = JSON.parse(a.availableOnPlans) as string[];
      return plans.includes(tenant.plan);
    })
    .map((a) => {
      const active = activeMap.get(a.id);
      return {
        ...a,
        availableOnPlans: JSON.parse(a.availableOnPlans),
        isActive: !!active,
        activatedAt: active?.activatedAt ?? null,
        effectivePrice: active?.priceOverride ?? a.price,
      };
    });

  return c.json({ data: catalog });
});

// GET /active — list my active add-ons with costs
marketplace.get("/active", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const tenantAddOns = await db.query.tenantAddOns.findMany({
    where: eq(schema.tenantAddOns.tenantId, tenantId),
  });

  const active = tenantAddOns.filter((ta) => !ta.cancelledAt);
  const addOns = await db.query.addOns.findMany();
  const addOnMap = new Map(addOns.map((a) => [a.id, a]));

  const result = active.map((ta) => {
    const addOn = addOnMap.get(ta.addOnId);
    return {
      ...ta,
      addOn: addOn ? {
        ...addOn,
        availableOnPlans: JSON.parse(addOn.availableOnPlans),
      } : null,
      effectivePrice: ta.priceOverride ?? addOn?.price ?? 0,
    };
  });

  return c.json({ data: result });
});

// POST /activate — activate an add-on
marketplace.post("/activate", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { addOnId } = await c.req.json<{ addOnId: string }>();

  // Check add-on exists and is available for this plan
  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const addOn = await db.query.addOns.findFirst({
    where: eq(schema.addOns.id, addOnId),
  });
  if (!addOn) return c.json({ error: "Add-on not found" }, 404);

  const plans = JSON.parse(addOn.availableOnPlans) as string[];
  if (!plans.includes(tenant.plan)) {
    return c.json({ error: "Add-on not available for your plan" }, 403);
  }

  // Check not already active
  const existing = await db.query.tenantAddOns.findFirst({
    where: and(
      eq(schema.tenantAddOns.tenantId, tenantId),
      eq(schema.tenantAddOns.addOnId, addOnId),
    ),
  });

  if (existing && !existing.cancelledAt) {
    return c.json({ error: "Add-on already active" }, 409);
  }

  // If previously cancelled, reactivate
  if (existing) {
    await db.update(schema.tenantAddOns)
      .set({ cancelledAt: null, activatedAt: new Date().toISOString() })
      .where(eq(schema.tenantAddOns.id, existing.id));

    const result = await db.query.tenantAddOns.findFirst({
      where: eq(schema.tenantAddOns.id, existing.id),
    });
    return c.json({ data: result });
  }

  const id = crypto.randomUUID();
  await db.insert(schema.tenantAddOns).values({
    id,
    tenantId,
    addOnId,
    activatedAt: new Date().toISOString(),
  });

  const result = await db.query.tenantAddOns.findFirst({
    where: eq(schema.tenantAddOns.id, id),
  });
  return c.json({ data: result }, 201);
});

// POST /deactivate — deactivate an add-on
marketplace.post("/deactivate", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { addOnId } = await c.req.json<{ addOnId: string }>();

  const existing = await db.query.tenantAddOns.findFirst({
    where: and(
      eq(schema.tenantAddOns.tenantId, tenantId),
      eq(schema.tenantAddOns.addOnId, addOnId),
    ),
  });

  if (!existing || existing.cancelledAt) {
    return c.json({ error: "Add-on not active" }, 400);
  }

  await db.update(schema.tenantAddOns)
    .set({ cancelledAt: new Date().toISOString() })
    .where(eq(schema.tenantAddOns.id, existing.id));

  return c.json({ data: { addOnId, status: "deactivated" } });
});

export default marketplace;
