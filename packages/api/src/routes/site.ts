import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { authMiddleware, requireRole } from "../middleware/auth";

const site = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /site/config — public, no auth needed
site.get("/config", async (c) => {
  const slug = c.get("tenantSlug");
  if (!slug) return c.json({ error: "Tenant not found" }, 404);

  const config = await c.env.TENANT_KV.get(`site:${slug}`, "json");
  if (!config) return c.json({ error: "Site not configured" }, 404);

  return c.json({ data: config });
});

// PUT /site/config — admin only
site.put("/config", authMiddleware, requireRole("super_admin"), async (c) => {
  const slug = c.get("tenantSlug");
  if (!slug) return c.json({ error: "Tenant not found" }, 404);

  const body = await c.req.json();
  await c.env.TENANT_KV.put(`site:${slug}`, JSON.stringify(body));

  return c.json({ data: body });
});

// POST /site/upload — upload image to R2
site.post("/upload", authMiddleware, requireRole("super_admin", "staff"), async (c) => {
  const slug = c.get("tenantSlug");
  if (!slug) return c.json({ error: "Tenant not found" }, 404);

  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file) return c.json({ error: "No file provided" }, 400);

  const key = `tenants/${slug}/${Date.now()}-${file.name}`;
  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ data: { key, url: `/uploads/${key}` } });
});

export default site;
