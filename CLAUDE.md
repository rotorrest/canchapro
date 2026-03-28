# CanchaPro — AI Context Guide

## What is this?

Multi-tenant SaaS for padel/sports club management. Booking, credits, members, billing. Built by Lumini for the LATAM market.

## Architecture (read order)

1. **This file** — orientation
2. `packages/api/` — Hono API on Cloudflare Workers + D1 (SQLite)
3. `web/` — React SPA (Vite) — the main dashboard for all roles
4. `landing/` — Next.js marketing site
5. `packages/shared/` — TypeScript types shared between API and frontend
6. `packages/router/` — Cloudflare Worker for subdomain routing
7. `packages/club-site/` — SSR club landing pages
8. `infra/` — Terraform for all Cloudflare resources

## Multi-tenancy model

Every request carries a tenant context:
- Frontend sends `x-tenant-id` header
- API middleware resolves tenant from header, subdomain, or custom domain
- All DB queries filter by `tenant_id`
- Platform admin (`admin@lumini.dev`) has no tenant — accesses all via `/v1/platform/*`

## Roles

| Role | Access | Tenant? |
|---|---|---|
| `platform_admin` | Everything, all tenants | No |
| `super_admin` | Full club management | Yes |
| `staff` | Operations (bookings, credits, members) | Yes |
| `member` | Book courts, view balance | Yes |

## Tech stack

- **Runtime**: Cloudflare Workers (edge, V8 isolates)
- **Database**: D1 (SQLite on edge), Drizzle ORM
- **Cache**: KV namespaces (TENANT_KV, CACHE_KV)
- **Files**: R2 bucket
- **Async**: Queues (WhatsApp notifications)
- **Cron**: Hourly reminders, monthly credit reset
- **Frontend**: React 18, Vite, Tailwind, Zustand, Lucide icons
- **Landing**: Next.js 14, static export
- **IaC**: Terraform + Cloudflare provider
- **CI/CD**: GitHub Actions → Wrangler deploy

## Key patterns

### API routes
All in `packages/api/src/routes/`. Pattern:
```ts
import { authMiddleware, requireRole } from "../middleware/auth";
import { someSchema, paginationSchema, paginate } from "../lib/validation";

router.post("/", requireRole("super_admin", "staff"), async (c) => {
  const body = someSchema.parse(await c.req.json()); // Zod validation
  const db = createDb(c.env.DB);
  // ... business logic ...
  return c.json({ data: result }, 201);
});
```

### Frontend data
`web/src/hooks/useTenantData.ts` — central hook that fetches all tenant data from API. Has 30s cache. Pages call `td.refetch()` after mutations.

### Mutations
Pages call `api.post/put/delete()` from `web/src/lib/api.ts`, then `td.refetch()`.

### Auth
JWT in localStorage. `authStore` → login → set token → `api.setToken()`. On rehydration, token is read from localStorage fallback.

## Pricing (customer-facing)

| Plan | Base | Per booking | Free |
|---|---|---|---|
| Starter | S/ 0 | S/ 1.00 | 150/month |
| Pro | S/ 79 | S/ 0.80 | Unlimited |
| Business | S/ 149 | S/ 0.50 | Unlimited |

WhatsApp reminders included in Pro+.

## Development

```bash
pnpm install
bash packages/api/scripts/setup-local.sh  # DB + seed
pnpm dev                                   # API :8787 + Web :5173
```

Accounts: `admin@icademo.com`, `staff@icademo.com`, `socio1@icademo.com` (pw: admin123)

## Guidelines for AI contributors

- **Don't create new files** unless necessary. Prefer editing existing ones.
- **Types**: Use `@/hooks/useTenantData` for data types, `@/lib/domain` for utilities.
- **Never import from `@/lib/mock-data`** — it's legacy. All data comes from API.
- **Validation**: Every API POST/PUT must have a Zod schema in `lib/validation.ts`.
- **Pagination**: Every GET list endpoint uses `paginationSchema` + `paginate()`.
- **Passwords**: PBKDF2 via `lib/crypto.ts`. Never SHA-256.
- **Mutations**: Call `api.post()` then `td.refetch()`. Don't manipulate local arrays.
- **Hooks order**: All React hooks BEFORE any early returns in components.
- **Commits**: Conventional commits. One feature per commit.
