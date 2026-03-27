import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const sedes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

sedes.use("/*", authMiddleware);

// GET /sedes — all authenticated users
sedes.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const result = await db.query.sedes.findMany({
    where: eq(schema.sedes.tenantId, tenantId),
  });

  return c.json({ data: result });
});

// POST /sedes — super_admin only
sedes.post("/", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const body = await c.req.json<{ name: string; address?: string; city?: string }>();

  const id = crypto.randomUUID();

  await db.insert(schema.sedes).values({
    id,
    tenantId,
    name: body.name,
    address: body.address ?? "",
    city: body.city ?? "",
  });

  const sede = await db.query.sedes.findFirst({ where: eq(schema.sedes.id, id) });
  return c.json({ data: sede }, 201);
});

// PUT /sedes/:id — super_admin only
sedes.put("/:id", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const body = await c.req.json();

  // Whitelist updatable fields to prevent overwriting id/tenantId
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.address !== undefined) updates.address = body.address;
  if (body.city !== undefined) updates.city = body.city;

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.sedes)
      .set(updates)
      .where(and(eq(schema.sedes.id, id), eq(schema.sedes.tenantId, tenantId)));
  }

  const sede = await db.query.sedes.findFirst({ where: eq(schema.sedes.id, id) });
  return c.json({ data: sede });
});

// DELETE /sedes/:id — super_admin only, blocked if courts are attached
sedes.delete("/:id", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();

  // Verify sede belongs to tenant
  const sede = await db.query.sedes.findFirst({
    where: and(eq(schema.sedes.id, id), eq(schema.sedes.tenantId, tenantId)),
  });
  if (!sede) return c.json({ error: "Sede not found" }, 404);

  // Check for attached courts
  const attachedCourt = await db.query.courts.findFirst({
    where: eq(schema.courts.sedeId, id),
  });
  if (attachedCourt) {
    return c.json({ error: "Cannot delete sede with courts attached. Reassign or remove courts first." }, 409);
  }

  await db
    .delete(schema.sedes)
    .where(and(eq(schema.sedes.id, id), eq(schema.sedes.tenantId, tenantId)));

  return c.json({ data: { id, deleted: true } });
});

export default sedes;
