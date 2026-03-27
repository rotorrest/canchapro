import { createMiddleware } from "hono/factory";
import type { Bindings, Variables } from "../types";

/**
 * Resolves tenant from:
 * 1. x-tenant-id header (from SPA)
 * 2. Subdomain of the request (slug.canchapro.com)
 * 3. Custom domain lookup in KV
 */
export const tenantMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  // Option 1: explicit header
  const headerTenant = c.req.header("x-tenant-id");
  if (headerTenant) {
    c.set("tenantId", headerTenant);
    c.set("tenantSlug", null);
    return next();
  }

  // Option 2: subdomain
  const host = c.req.header("host") ?? "";
  const parts = host.split(".");

  // slug.canchapro.com → parts[0] = slug
  if (parts.length >= 3 && parts[1] === "canchapro") {
    const slug = parts[0];
    const cached = await c.env.TENANT_KV.get(`tenant:${slug}`, "json") as { id: string } | null;
    if (cached) {
      c.set("tenantId", cached.id);
      c.set("tenantSlug", slug);
      return next();
    }
  }

  // Option 3: custom domain lookup
  const domainMapping = await c.env.TENANT_KV.get(`domain:${host}`) as string | null;
  if (domainMapping) {
    const cached = await c.env.TENANT_KV.get(`tenant:${domainMapping}`, "json") as { id: string } | null;
    if (cached) {
      c.set("tenantId", cached.id);
      c.set("tenantSlug", domainMapping);
      return next();
    }
  }

  // No tenant resolved — only platform routes are allowed
  c.set("tenantId", null);
  c.set("tenantSlug", null);
  return next();
});
