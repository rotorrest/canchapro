import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const site = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /site/config — public, no auth needed
site.get("/config", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "Tenant not found" }, 404);

  const db = createDb(c.env.DB);

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const branding = await db.query.tenantBranding.findFirst({
    where: eq(schema.tenantBranding.tenantId, tenantId),
  });

  return c.json({
    data: {
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, plan: tenant.plan },
      branding: branding ?? null,
    },
  });
});

// PUT /site/config — admin only, updates branding
site.put("/config", authMiddleware, requireRole("super_admin"), async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "Tenant not found" }, 404);

  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    clubName?: string; primaryColor?: string; logoUrl?: string;
    heroTitle?: string; heroSubtitle?: string;
    address?: string; phone?: string; instagram?: string; hours?: string;
    photos?: string[];
  }>();

  const updates: Record<string, unknown> = {};
  if (body.clubName !== undefined) updates.clubName = body.clubName;
  if (body.primaryColor !== undefined) updates.primaryColor = body.primaryColor;
  if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
  if (body.heroTitle !== undefined) updates.heroTitle = body.heroTitle;
  if (body.heroSubtitle !== undefined) updates.heroSubtitle = body.heroSubtitle;
  if (body.address !== undefined) updates.address = body.address;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.instagram !== undefined) updates.instagram = body.instagram;
  if (body.hours !== undefined) updates.hours = body.hours;
  if (body.photos !== undefined) updates.photos = JSON.stringify(body.photos);

  if (Object.keys(updates).length > 0) {
    await db.update(schema.tenantBranding).set(updates).where(eq(schema.tenantBranding.tenantId, tenantId));
  }

  // Also update KV cache for club-site worker
  const branding = await db.query.tenantBranding.findFirst({
    where: eq(schema.tenantBranding.tenantId, tenantId),
  });
  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (tenant && branding) {
    await c.env.TENANT_KV.put(`site:${tenant.slug}`, JSON.stringify(branding));
  }

  return c.json({ data: branding });
});

// POST /site/upload — upload image to R2
site.post("/upload", authMiddleware, requireRole("super_admin", "staff"), async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) return c.json({ error: "Tenant not found" }, 404);

  const db = createDb(c.env.DB);
  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
  });
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file) return c.json({ error: "No file provided" }, 400);

  // Limit file size to 5MB
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large (max 5MB)" }, 400);
  }

  const key = `tenants/${tenant.slug}/${Date.now()}-${file.name}`;
  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ data: { key, url: `/uploads/${key}` } });
});

export default site;
