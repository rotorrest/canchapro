import { createMiddleware } from "hono/factory";
import type { Bindings, Variables } from "../types";
import type { AuthTokenPayload } from "@canchapro/shared";

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);

  try {
    // Verify JWT using Web Crypto API (available in Workers)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(c.env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const [headerB64, payloadB64, sigB64] = token.split(".");
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const payload: AuthTokenPayload = JSON.parse(atob(payloadB64));

    if (payload.exp < Date.now() / 1000) {
      return c.json({ error: "Token expired" }, 401);
    }

    // Verify tenant match
    const tenantId = c.get("tenantId");
    if (tenantId && payload.tid !== tenantId && payload.role !== "platform_admin") {
      return c.json({ error: "Tenant mismatch" }, 403);
    }

    c.set("user", {
      id: payload.sub,
      tenantId: payload.tid,
      email: "",
      name: "",
      role: payload.role,
      status: "active",
      createdAt: "",
    });

    return next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

/** Require specific roles */
export function requireRole(...roles: string[]) {
  return createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    return next();
  });
}
