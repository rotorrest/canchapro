import { Hono } from "hono";
import { renderSite } from "./template";

interface Env {
  TENANT_KV: KVNamespace;
  UPLOADS: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// Resolve tenant slug from host
function resolveSlug(host: string): string | null {
  const parts = host.split(".");
  if (parts.length >= 3 && parts[1] === "canchapro") {
    return parts[0];
  }
  return null;
}

// Serve club landing page
app.get("/", async (c) => {
  const host = c.req.header("host") ?? "";
  let slug = resolveSlug(host);

  // Custom domain fallback
  if (!slug) {
    const mapped = await c.env.TENANT_KV.get(`domain:${host}`);
    if (mapped) slug = mapped;
  }

  if (!slug) return c.text("Not found", 404);

  const config = await c.env.TENANT_KV.get(`site:${slug}`, "json") as Record<string, unknown> | null;
  if (!config) return c.text("Site not configured", 404);

  const html = renderSite(config);

  return c.html(html, 200, {
    "Cache-Control": "public, max-age=60, s-maxage=300",
  });
});

// Serve R2 uploads
app.get("/uploads/*", async (c) => {
  const key = c.req.path.replace("/uploads/", "");
  const object = await c.env.UPLOADS.get(key);
  if (!object) return c.text("Not found", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(object.body, { headers });
});

export default app;
