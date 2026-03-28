# API — Hono REST API on Cloudflare Workers

Hono-based REST API running on Cloudflare Workers. Uses D1 (SQLite) for storage, KV for caching, R2 for file uploads, and Queues for async notification delivery.

## File Layout

```
src/
├── index.ts          Entry point (fetch + queue + cron exports)
├── types.ts          Bindings (D1, KV, R2, Queue) + Variables
├── lib/
│   ├── crypto.ts     PBKDF2 hashing, JWT signing
│   └── validation.ts Zod schemas for all endpoints + pagination helper
├── db/
│   ├── schema.ts     Drizzle ORM tables (17 tables)
│   └── index.ts      createDb factory
├── middleware/
│   ├── auth.ts       JWT verification + requireRole()
│   └── tenant.ts     Tenant resolution (header/subdomain/domain)
├── routes/
│   ├── auth.ts       Login, register, password flows
│   ├── courts.ts     CRUD + schedules + blocks + availability
│   ├── bookings.ts   Create, cancel, status (with credit calculation)
│   ├── members.ts    CRUD, credit sales, people management
│   ├── sedes.ts      Multi-location CRUD
│   ├── site.ts       Branding + file upload
│   ├── platform.ts   Tenant CRUD, billing, add-on catalog
│   └── marketplace.ts Add-on activation for clubs
├── queue/
│   └── notifications.ts WhatsApp message consumer
└── cron/
    └── scheduled.ts  Booking reminders + monthly credit reset
```

## Key Patterns

**Zod validation on every POST/PUT.** Schemas live in `src/lib/validation.ts`. Parse the request body with the schema before doing anything else.

**Pagination on every GET list.** Use the pagination helper from `validation.ts` — all list endpoints return `{ data, total, page, pageSize }`.

**DB access.** Always go through `createDb(c.env.DB)` from `src/db/index.ts`. Never use `c.env.DB` directly.

**Auth.** Routes use `authMiddleware` for JWT verification, then `requireRole()` to gate by role. Both live in `src/middleware/auth.ts`.

**Tenant isolation.** The tenant middleware in `src/middleware/tenant.ts` resolves the current tenant from a header, subdomain, or custom domain. All data queries are scoped to the resolved tenant.

## Database

17 Drizzle ORM tables defined in `src/db/schema.ts`.

**Core tables:** tenants, users, members, courts, bookings, credit_transactions

**Supporting tables:** sedes, court_schedules, court_blocks, credit_prices, credit_sales, rate_cards, invoices, add_ons, tenant_add_ons, tenant_branding

Look at `schema.ts` for column definitions, defaults, and relations.

## Environment

`wrangler.toml` configures all bindings (D1, KV, R2, Queue). Local development uses Miniflare. Production deployments use `--env production`.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Start local dev server with Miniflare |
| `build` | Build for production |
| `deploy` | Deploy to Cloudflare Workers |
| `db:generate` | Generate Drizzle migration files from schema changes |
| `db:migrate` | Run pending migrations against D1 |

## Adding a New Endpoint

1. Add Zod schema(s) to `src/lib/validation.ts`
2. Add the route in `src/routes/*.ts` (new file if it is a new resource, existing file if it extends one)
3. Protect the route with `authMiddleware` + `requireRole()`
4. Parse the request body with the Zod schema
5. If the endpoint returns a list, add pagination using the pagination helper
