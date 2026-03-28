import { Hono } from "hono";
import { eq, and, inArray } from "drizzle-orm";
import { ZodError } from "zod";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { hashPassword, generateTempPassword } from "../lib/crypto";
import {
  createMemberSchema,
  updateMemberSchema,
  creditAdjustSchema,
  creditSaleSchema,
  paginationSchema,
  paginate,
} from "../lib/validation";

const members = new Hono<{ Bindings: Bindings; Variables: Variables }>();

members.use("/*", authMiddleware);

// ═══════════════════════════════════════════════════════════════════════════
// MEMBER ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /members/me — member gets own profile with credit balance
members.get("/me", requireRole("member"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");

  const member = await db.query.members.findFirst({
    where: and(
      eq(schema.members.tenantId, tenantId),
      eq(schema.members.userId, user.id)
    ),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  });

  return c.json({
    data: {
      id: member.id,
      userId: member.userId,
      name: userRecord?.name ?? "",
      email: userRecord?.email ?? "",
      creditBalance: member.creditBalance,
      creditAllocationMonthly: member.creditAllocationMonthly,
      lastBookingAt: member.lastBookingAt,
    },
  });
});

// GET /members/people — list staff and admin users (not members)
members.get("/people", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const result = await db.query.users.findMany({
    where: and(
      eq(schema.users.tenantId, tenantId),
      inArray(schema.users.role, ["super_admin", "staff"])
    ),
  });

  const data = result.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));

  return c.json({ data });
});

// POST /members/people — create a staff/admin user
members.post("/people", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const body = await c.req.json<{
    email: string;
    name: string;
    role: "staff" | "super_admin";
  }>();

  if (!body.email || !body.name || !body.role) {
    return c.json({ error: "email, name, and role are required" }, 400);
  }
  if (!["staff", "super_admin"].includes(body.role)) {
    return c.json({ error: "role must be staff or super_admin" }, 400);
  }

  const existing = await db.query.users.findFirst({
    where: and(
      eq(schema.users.email, body.email.toLowerCase()),
      eq(schema.users.tenantId, tenantId)
    ),
  });
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const userId = crypto.randomUUID();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await db.insert(schema.users).values({
    id: userId,
    tenantId,
    email: body.email.toLowerCase(),
    name: body.name,
    role: body.role,
    status: "active",
    passwordHash,
  });

  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "welcome_staff",
    tenantId,
    userId,
    email: body.email.toLowerCase(),
    name: body.name,
    tempPassword,
  });

  return c.json({
    data: {
      id: userId,
      email: body.email.toLowerCase(),
      name: body.name,
      role: body.role,
      status: "active",
    },
  }, 201);
});

// PUT /members/people/:id — update staff user
members.put("/people/:id", requireRole("super_admin"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const body = await c.req.json<{
    name?: string;
    email?: string;
    role?: "staff" | "super_admin";
    status?: "active" | "suspended" | "inactive";
  }>();

  const userRecord = await db.query.users.findFirst({
    where: and(eq(schema.users.id, id), eq(schema.users.tenantId, tenantId)),
  });
  if (!userRecord) return c.json({ error: "User not found" }, 404);
  if (!["super_admin", "staff"].includes(userRecord.role)) {
    return c.json({ error: "User is not a staff/admin" }, 400);
  }

  if (body.role && !["staff", "super_admin"].includes(body.role)) {
    return c.json({ error: "role must be staff or super_admin" }, 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email.toLowerCase();
  if (body.role !== undefined) updates.role = body.role;
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  await db.update(schema.users).set(updates).where(eq(schema.users.id, id));

  const updated = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });

  return c.json({
    data: {
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      role: updated!.role,
      status: updated!.status,
    },
  });
});

// GET /members — list all members (staff, super_admin)
members.get("/", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { page, limit } = paginationSchema.parse(c.req.query());

  const result = await db.query.members.findMany({
    where: eq(schema.members.tenantId, tenantId),
  });

  // Join with user data for each member
  const data = await Promise.all(
    result.map(async (m) => {
      const userRecord = await db.query.users.findFirst({
        where: eq(schema.users.id, m.userId),
      });
      return {
        id: m.id,
        userId: m.userId,
        name: userRecord?.name ?? "",
        email: userRecord?.email ?? "",
        status: userRecord?.status ?? "inactive",
        creditBalance: m.creditBalance,
        creditAllocationMonthly: m.creditAllocationMonthly,
        lastBookingAt: m.lastBookingAt,
      };
    })
  );

  return c.json(paginate(data, { page, limit }));
});

// POST /members — create a new member (staff creates user + member)
members.post("/", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  let body;
  try {
    body = createMemberSchema.parse(await c.req.json());
  } catch (e) {
    if (e instanceof ZodError) return c.json({ error: e.issues }, 400);
    throw e;
  }

  const existing = await db.query.users.findFirst({
    where: and(
      eq(schema.users.email, body.email.toLowerCase()),
      eq(schema.users.tenantId, tenantId)
    ),
  });
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const userId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await db.insert(schema.users).values({
    id: userId,
    tenantId,
    email: body.email.toLowerCase(),
    name: body.name,
    role: "member",
    status: "active",
    passwordHash,
  });

  await db.insert(schema.members).values({
    id: memberId,
    tenantId,
    userId,
    creditBalance: 0,
    creditAllocationMonthly: body.creditAllocationMonthly ?? 0,
  });

  await c.env.NOTIFICATIONS_QUEUE.send({
    type: "welcome_member",
    tenantId,
    userId,
    memberId,
    email: body.email.toLowerCase(),
    name: body.name,
    phone: body.phone,
    tempPassword,
  });

  return c.json({
    data: {
      id: memberId,
      userId,
      email: body.email.toLowerCase(),
      name: body.name,
      creditBalance: 0,
      creditAllocationMonthly: body.creditAllocationMonthly ?? 0,
    },
  }, 201);
});

// GET /members/:id — get single member with user details
members.get("/:id", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, id), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, member.userId),
  });

  return c.json({
    data: {
      id: member.id,
      userId: member.userId,
      name: userRecord?.name ?? "",
      email: userRecord?.email ?? "",
      status: userRecord?.status ?? "inactive",
      creditBalance: member.creditBalance,
      creditAllocationMonthly: member.creditAllocationMonthly,
      lastBookingAt: member.lastBookingAt,
    },
  });
});

// PUT /members/:id — update member details
members.put("/:id", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();

  let body;
  try {
    body = updateMemberSchema.parse(await c.req.json());
  } catch (e) {
    if (e instanceof ZodError) return c.json({ error: e.issues }, 400);
    throw e;
  }

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, id), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  // Update user fields
  const userUpdates: Record<string, unknown> = {};
  if (body.name !== undefined) userUpdates.name = body.name;
  if (body.email !== undefined) userUpdates.email = body.email.toLowerCase();
  if (body.status !== undefined) userUpdates.status = body.status;

  if (Object.keys(userUpdates).length > 0) {
    await db
      .update(schema.users)
      .set(userUpdates)
      .where(eq(schema.users.id, member.userId));
  }

  // Update member fields
  if (body.creditAllocationMonthly !== undefined) {
    await db
      .update(schema.members)
      .set({ creditAllocationMonthly: body.creditAllocationMonthly })
      .where(eq(schema.members.id, id));
  }

  // Fetch updated record
  const updatedMember = await db.query.members.findFirst({
    where: eq(schema.members.id, id),
  });
  const updatedUser = await db.query.users.findFirst({
    where: eq(schema.users.id, member.userId),
  });

  return c.json({
    data: {
      id: updatedMember!.id,
      userId: updatedMember!.userId,
      name: updatedUser?.name ?? "",
      email: updatedUser?.email ?? "",
      status: updatedUser?.status ?? "inactive",
      creditBalance: updatedMember!.creditBalance,
      creditAllocationMonthly: updatedMember!.creditAllocationMonthly,
      lastBookingAt: updatedMember!.lastBookingAt,
    },
  });
});

// POST /members/:id/credits — adjust credits (manual adjustment)
members.post("/:id/credits", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const { id } = c.req.param();

  let body;
  try {
    body = creditAdjustSchema.parse(await c.req.json());
  } catch (e) {
    if (e instanceof ZodError) return c.json({ error: e.issues }, 400);
    throw e;
  }

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, id), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  await db
    .update(schema.members)
    .set({ creditBalance: member.creditBalance + body.amount })
    .where(eq(schema.members.id, id));

  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: id,
    amount: body.amount,
    type: "adjustment",
    reason: body.reason,
    createdBy: user.id,
  });

  return c.json({ data: { newBalance: member.creditBalance + body.amount } });
});

// POST /members/:id/credit-sales — record a credit sale
members.post("/:id/credit-sales", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const { id } = c.req.param();

  let body;
  try {
    body = creditSaleSchema.parse(await c.req.json());
  } catch (e) {
    if (e instanceof ZodError) return c.json({ error: e.issues }, 400);
    throw e;
  }

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, id), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  const saleId = crypto.randomUUID();
  const newBalance = member.creditBalance + body.amount;

  // Update member balance
  await db
    .update(schema.members)
    .set({ creditBalance: newBalance })
    .where(eq(schema.members.id, id));

  // Insert credit sale record
  await db.insert(schema.creditSales).values({
    id: saleId,
    tenantId,
    memberId: id,
    amount: body.amount,
    pricePaid: body.pricePaid,
    paymentMethod: body.paymentMethod,
    description: body.description ?? "",
    createdBy: user.id,
  });

  // Insert credit transaction
  await db.insert(schema.creditTransactions).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: id,
    amount: body.amount,
    type: "allocation",
    reason: body.description ?? "Venta de créditos",
    createdBy: user.id,
  });

  return c.json({
    data: {
      saleId,
      memberId: id,
      amount: body.amount,
      pricePaid: body.pricePaid,
      newBalance,
    },
  }, 201);
});

// GET /members/:id/transactions — get credit transactions for a member
members.get("/:id/transactions", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const { id } = c.req.param();
  const { page, limit } = paginationSchema.parse(c.req.query());

  const member = await db.query.members.findFirst({
    where: and(eq(schema.members.id, id), eq(schema.members.tenantId, tenantId)),
  });
  if (!member) return c.json({ error: "Member not found" }, 404);

  const txs = await db.query.creditTransactions.findMany({
    where: and(
      eq(schema.creditTransactions.memberId, id),
      eq(schema.creditTransactions.tenantId, tenantId)
    ),
  });

  return c.json(paginate(txs, { page, limit }));
});

export default members;
