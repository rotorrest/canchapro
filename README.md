# CanchaPro

Multi-tenant SaaS for padel clubs and sports complexes. Manage bookings, members, credits, and billing from one platform.

## Monorepo structure

```
├── web/                    React SPA — dashboard for all roles
├── landing/                Next.js — marketing site (canchapro.com)
├── packages/
│   ├── api/                Cloudflare Worker — REST API + Queue + Cron
│   ├── shared/             TypeScript types and constants
│   ├── router/             Worker — subdomain routing
│   └── club-site/          Worker — SSR club public pages
├── infra/                  Terraform — all Cloudflare resources
├── docs/                   Product docs (pricing, architecture, roadmap)
├── CLAUDE.md               AI context guide
└── DEPLOY.md               Production deployment roadmap
```

## Quick start

```bash
pnpm install
bash packages/api/scripts/setup-local.sh
pnpm dev
```

- **API**: http://localhost:8787
- **Web**: http://localhost:5173
- **Landing**: `cd landing && npm run dev` → http://localhost:3000

## Demo accounts (password: admin123)

| Role | Email | Club |
|---|---|---|
| Platform | admin@lumini.dev | Lumini (all clubs) |
| Admin | admin@icademo.com | IcaDemo Padel Club |
| Staff | staff@icademo.com | IcaDemo Padel Club |
| Member | socio1@icademo.com | IcaDemo Padel Club |
| Admin | admin@limademo.com | LimaDemo Padel Club |

## API endpoints (58 total)

| Module | Endpoints | Auth |
|---|---|---|
| Auth | login, register, refresh, change-password, forgot, reset | Public/JWT |
| Courts | CRUD, schedules, blocks, availability | JWT |
| Bookings | create (member+staff), cancel, status, list | JWT |
| Members | CRUD, credit sales, transactions, people | JWT + role |
| Sedes | CRUD | JWT + admin |
| Site | branding config, file upload | JWT + admin |
| Platform | tenant CRUD, billing, add-on catalog | platform_admin |
| Marketplace | catalog, activate/deactivate add-ons | JWT + admin |

All POST/PUT validated with Zod. All GET lists paginated (`?page=1&limit=20`).

## Tech stack

| Layer | Technology |
|---|---|
| API | Hono + Cloudflare Workers |
| Database | D1 (SQLite edge) + Drizzle ORM |
| Cache | KV Namespaces |
| Storage | R2 |
| Async | Queues + Cron Triggers |
| Frontend | React 18 + Vite + Tailwind |
| Landing | Next.js 14 |
| Auth | JWT + PBKDF2 |
| Validation | Zod |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the full production deployment roadmap.

## License

Private — Lumini
