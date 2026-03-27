import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware } from "../middleware/auth";
import { hashPassword, verifyPassword, signJwt } from "../lib/crypto";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ── Login ──────────────────────────────────────────────────────────────────

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId");

  // Scope by tenant if resolved, otherwise allow platform_admin login without tenant
  const user = tenantId
    ? await db.query.users.findFirst({
        where: and(eq(schema.users.email, email.toLowerCase()), eq(schema.users.tenantId, tenantId)),
      })
    : await db.query.users.findFirst({
        where: eq(schema.users.email, email.toLowerCase()),
      });

  if (!user || user.status !== "active") {
    return c.json({ error: "Credenciales invalidas" }, 401);
  }

  const valid = await verifyPassword(password, user.id, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Credenciales invalidas" }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt(
    { sub: user.id, tid: user.tenantId, role: user.role, iat: now, exp: now + 86400 },
    c.env.JWT_SECRET
  );

  // Get tenant name if applicable
  let tenantName: string | null = null;
  if (user.tenantId) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, user.tenantId),
    });
    tenantName = tenant?.name ?? null;
  }

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
    tenantName,
  });
});

// ── Register ───────────────────────────────────────────────────────────────

auth.post("/register", async (c) => {
  const { email, password, name, tenantId: bodyTenantId } = await c.req.json<{
    email: string; password: string; name: string; tenantId?: string;
  }>();
  const db = createDb(c.env.DB);
  const tenantId = bodyTenantId ?? c.get("tenantId");

  if (!tenantId) return c.json({ error: "Tenant required" }, 400);
  if (!email || !password || !name) return c.json({ error: "Missing fields" }, 400);
  if (password.length < 8) return c.json({ error: "Password must be at least 8 characters" }, 400);

  const existing = await db.query.users.findFirst({
    where: and(eq(schema.users.email, email.toLowerCase()), eq(schema.users.tenantId, tenantId)),
  });
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const userId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const passwordHash = await hashPassword(password, userId);

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

// ── Refresh Token ──────────────────────────────────────────────────────────

auth.post("/refresh", authMiddleware, async (c) => {
  const user = c.get("user");
  const now = Math.floor(Date.now() / 1000);

  const token = await signJwt(
    { sub: user.id, tid: user.tenantId, role: user.role, iat: now, exp: now + 86400 },
    c.env.JWT_SECRET
  );

  return c.json({ token });
});

// ── Change Password ────────────────────────────────────────────────────────

auth.post("/change-password", authMiddleware, async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user");
  const { currentPassword, newPassword } = await c.req.json<{
    currentPassword: string; newPassword: string;
  }>();

  if (!newPassword || newPassword.length < 8) {
    return c.json({ error: "New password must be at least 8 characters" }, 400);
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  });
  if (!dbUser) return c.json({ error: "User not found" }, 404);

  const valid = await verifyPassword(currentPassword, dbUser.id, dbUser.passwordHash);
  if (!valid) return c.json({ error: "Current password is incorrect" }, 401);

  const newHash = await hashPassword(newPassword, dbUser.id);
  await db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, user.id));

  return c.json({ data: { message: "Password updated" } });
});

// ── Forgot Password ────────────────────────────────────────────────────────

auth.post("/forgot-password", async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  const tenantId = c.get("tenantId");
  const db = createDb(c.env.DB);

  // Generate a 6-digit code and store in KV (15 min TTL)
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const user = tenantId
    ? await db.query.users.findFirst({
        where: and(eq(schema.users.email, email.toLowerCase()), eq(schema.users.tenantId, tenantId)),
      })
    : await db.query.users.findFirst({
        where: eq(schema.users.email, email.toLowerCase()),
      });

  if (user) {
    await c.env.CACHE_KV.put(`reset:${email.toLowerCase()}`, JSON.stringify({ code, userId: user.id }), {
      expirationTtl: 900,
    });

    await c.env.NOTIFICATIONS_QUEUE.send({
      type: "password_reset",
      tenantId,
      email: email.toLowerCase(),
      code,
    });
  }

  // Always return success to prevent email enumeration
  return c.json({ data: { message: "If the email exists, a reset code will be sent" } });
});

// ── Verify Reset Code & Set New Password ───────────────────────────────────

auth.post("/reset-password", async (c) => {
  const { email, code, newPassword } = await c.req.json<{
    email: string; code: string; newPassword: string;
  }>();
  const db = createDb(c.env.DB);

  if (!newPassword || newPassword.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  const stored = await c.env.CACHE_KV.get(`reset:${email.toLowerCase()}`, "json") as {
    code: string; userId: string;
  } | null;

  if (!stored || stored.code !== code) {
    return c.json({ error: "Invalid or expired code" }, 400);
  }

  const newHash = await hashPassword(newPassword, stored.userId);
  await db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, stored.userId));

  // Delete the used code
  await c.env.CACHE_KV.delete(`reset:${email.toLowerCase()}`);

  return c.json({ data: { message: "Password reset successful" } });
});

export default auth;
