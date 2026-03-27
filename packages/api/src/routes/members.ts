import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Bindings, Variables } from "../types";
import { createDb, schema } from "../db";
import { authMiddleware, requireRole } from "../middleware/auth";

const members = new Hono<{ Bindings: Bindings; Variables: Variables }>();

members.use("/*", authMiddleware);

// GET /members — staff, super_admin
members.get("/", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;

  const result = await db.query.members.findMany({
    where: eq(schema.members.tenantId, tenantId),
  });

  return c.json({ data: result });
});

// POST /members/:id/credits — adjust credits
members.post("/:id/credits", requireRole("super_admin", "staff"), async (c) => {
  const db = createDb(c.env.DB);
  const tenantId = c.get("tenantId")!;
  const user = c.get("user");
  const { id } = c.req.param();
  const body = await c.req.json<{ amount: number; reason: string }>();

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

// GET /members/:id/transactions
members.get("/:id/transactions", async (c) => {
  const db = createDb(c.env.DB);
  const { id } = c.req.param();

  const txs = await db.query.creditTransactions.findMany({
    where: eq(schema.creditTransactions.memberId, id),
  });

  return c.json({ data: txs });
});

export default members;
