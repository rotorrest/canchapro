import { Hono } from "hono";
import { renderSite } from "./template";

interface Env {
  TENANT_KV: KVNamespace;
  UPLOADS: R2Bucket;
  WEB_APP_URL: string;
}

const RESERVED_SUBDOMAINS = new Set(["api", "admin", "app", "www", "fallback", ""]);

const app = new Hono<{ Bindings: Env }>();

// Extract tenant slug from hostname
function extractSlug(host: string): string {
  return host.split(".")[0] ?? "";
}

// Proxy requests to the SPA Pages project
async function proxySPA(request: Request, webAppUrl: string): Promise<Response> {
  const url = new URL(request.url);
  // Strip /app prefix — SPA serves from root
  const spaPath = url.pathname.replace(/^\/app/, "") || "/";
  const target = new URL(spaPath + url.search, webAppUrl);

  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
  });

  // Clone response to modify headers
  const response = new Response(res.body, res);
  response.headers.set("X-Tenant-Slug", extractSlug(new URL(request.url).hostname));
  return response;
}

// ── /app/* → Proxy to SPA ────────────────────────────────────────────────────

app.all("/app/*", async (c) => {
  const host = c.req.header("host") ?? "";
  const slug = extractSlug(host);

  if (RESERVED_SUBDOMAINS.has(slug)) {
    return c.text("Not found", 404);
  }

  return proxySPA(c.req.raw, c.env.WEB_APP_URL);
});

app.get("/app", async (c) => {
  const host = c.req.header("host") ?? "";
  const slug = extractSlug(host);

  if (RESERVED_SUBDOMAINS.has(slug)) {
    return c.text("Not found", 404);
  }

  return proxySPA(c.req.raw, c.env.WEB_APP_URL);
});

// ── /uploads/* → Serve from R2 ──────────────────────────────────────────────

app.get("/uploads/*", async (c) => {
  const key = c.req.path.replace("/uploads/", "");
  const object = await c.env.UPLOADS.get(key);
  if (!object) return c.text("Not found", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(object.body, { headers });
});

// ── /* → Club branded landing page ──────────────────────────────────────────

app.get("/*", async (c) => {
  const host = c.req.header("host") ?? "";
  let slug = extractSlug(host);

  if (RESERVED_SUBDOMAINS.has(slug)) {
    return c.text("Not found", 404);
  }

  // Try custom domain resolution if slug doesn't look like a subdomain
  const parts = host.split(".");
  if (parts.length <= 2 || parts[1] !== "canchapro") {
    const mapped = await c.env.TENANT_KV.get(`domain:${host}`);
    if (mapped) slug = mapped;
    else return c.text("Not found", 404);
  }

  const config = await c.env.TENANT_KV.get(`site:${slug}`, "json") as Record<string, unknown> | null;
  if (!config) return c.text("Site not configured", 404);

  const html = renderSite(config);

  return c.html(html, 200, {
    "Cache-Control": "public, max-age=60, s-maxage=300",
  });
});

export default app;
