import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const db = createDb(c.env.DB);

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  });

  if (!user || user.status !== "active") {
    return c.json({ error: "Credenciales invalidas" }, 401);
  }

  // Verify password (using Web Crypto)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password + user.id));
  const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

  if (hash !== user.passwordHash) {
    return c.json({ error: "Credenciales invalidas" }, 401);
  }

  // Generate JWT
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    tid: user.tenantId,
    role: user.role,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const token = `${header}.${body}.${sig}`;

  return c.json({
    token,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
  });
});

// ── Register ────────────────────────────────────────────────────────────────

auth.post("/register", async (c) => {
  const { email, password, name, tenantId: bodyTenantId } = await c.req.json<{
    email: string; password: string; name: string; tenantId?: string;
  }>();
  const db = createDb(c.env.DB);
  const tenantId = bodyTenantId ?? c.get("tenantId");

  if (!tenantId) return c.json({ error: "Tenant required" }, 400);

  const existing = await db.query.users.findFirst({
    where: and(eq(schema.users.email, email.toLowerCase()), eq(schema.users.tenantId, tenantId)),
  });
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const userId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password + userId));
  const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

  await db.insert(schema.users).values({
    id: userId,
    tenantId,
    email: email.toLowerCase(),
    name,
    role: "member",
    status: "active",
    passwordHash,
  });

  await db.insert(schema.members).values({
    id: memberId,
    tenantId,
    userId,
    creditBalance: 0,
    creditAllocationMonthly: 0,
  });

  return c.json({
    data: { id: userId, tenantId, email: email.toLowerCase(), name, role: "member" },
  }, 201);
});

// ── Refresh Token ───────────────────────────────────────────────────────────

auth.post("/refresh", authMiddleware, async (c) => {
  const user = c.get("user");
  const encoder = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: user.id,
    tid: user.tenantId,
    role: user.role,
    iat: now,
    exp: now + 3600,
  };

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return c.json({ token: `${header}.${body}.${sig}` });
});

// ── Forgot Password ─────────────────────────────────────────────────────────

auth.post("/forgot-password", async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  const tenantId = c.get("tenantId");

  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "password_reset",
    tenantId,
    email: email.toLowerCase(),
  });

  return c.json({ data: { message: "If the email exists, a reset link will be sent" } });
});

export default auth;
