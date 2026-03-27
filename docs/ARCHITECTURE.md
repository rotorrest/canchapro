# Arquitectura SaaS Multi-Tenant — Cloudflare

## Dominios y Rutas

```
padelclub.app                          → Marketing site (vender el SaaS)
app.padelclub.app                      → Login global → redirige al tenant
icapadel.padelclub.app                 → App del club (admin/staff/socio)
icapadel.padelclub.app/site            → Landing pública del club
app.icapadelclub.pe                    → Custom domain (CNAME → icapadel.padelclub.app)
admin.padelclub.app                    → Panel interno Lumini
api.padelclub.app                      → API backend
```

### Cómo funciona el routing

```
Request llega a *.padelclub.app
        │
        ├── padelclub.app          → Cloudflare Pages (marketing)
        ├── api.padelclub.app      → Cloudflare Worker (API)
        ├── admin.padelclub.app    → Cloudflare Pages (panel Lumini)
        ├── app.padelclub.app      → Login global
        └── {slug}.padelclub.app   → Worker lee slug
                │
                ├── /site/*  → Landing pública (SSR desde Worker)
                └── /*       → App SPA (Pages) + tenant context
```

---

## Stack por servicio

```
┌──────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                          │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Pages      │  │   Pages     │  │   Pages         │  │
│  │  Marketing   │  │  App SPA    │  │  Admin Lumini   │  │
│  │  Site        │  │  (React)    │  │  Panel          │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────┘  │
│                          │                               │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │              Workers (API)                          │  │
│  │                                                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │  │
│  │  │ Auth     │ │ Tenant   │ │ Landing SSR         │ │  │
│  │  │ Worker   │ │ Router   │ │ (club public site)  │ │  │
│  │  └──────────┘ └──────────┘ └─────────────────────┘ │  │
│  │                                                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │  │
│  │  │ Bookings │ │ Credits  │ │ Members / Courts    │ │  │
│  │  │ API      │ │ API      │ │ API                 │ │  │
│  │  └──────────┘ └──────────┘ └─────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌────────────────┐  │
│  │    D1    │ │    KV    │ │  R2  │ │    Queues      │  │
│  │ Database │ │  Config  │ │ Files│ │ Email/WhatsApp │  │
│  │ (SQLite) │ │  Cache   │ │ Imgs │ │  Async jobs    │  │
│  └──────────┘ └──────────┘ └──────┘ └────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │        Cloudflare for SaaS (Custom Domains)         │ │
│  │   *.padelclub.app wildcard + custom domain SSL      │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Marketing Site — `padelclub.app`

- **Qué:** Landing page para vender el SaaS
- **Dónde:** Cloudflare Pages (static)
- **Tech:** Astro o Next.js static export
- **Contenido:** Hero, features, precios, testimonios, CTA "Crea tu club"
- **SEO:** Pre-rendered, sitemap, Open Graph

## 2. App del Club — `{slug}.padelclub.app`

- **Qué:** La aplicación SaaS (admin, staff, socio)
- **Dónde:** Cloudflare Pages (SPA) + Worker para resolver tenant
- **Tech:** React (Vite) — la misma SPA para todos los tenants
- **Cómo sabe qué tenant:** El Worker lee el subdomain/custom domain, busca en KV el `tenant_id`, lo inyecta como header o cookie. El SPA lo lee al cargar.

```
Request: icapadel.padelclub.app/courts
    │
    Worker middleware:
    1. Lee hostname → "icapadel"
    2. KV.get("tenant:icapadel") → { id: "t_abc", name: "Ica Padel Club", ... }
    3. Si custom domain: KV.get("domain:app.icapadelclub.pe") → "icapadel"
    4. Pasa tenant_id al SPA via header x-tenant-id
    5. Sirve el SPA estático
```

## 3. Landing Pública del Club — `{slug}.padelclub.app/site`

- **Qué:** Página pública del club (info, horarios, ubicación, fotos)
- **Dónde:** Worker con SSR (para SEO)
- **Tech:** HTML renderizado por el Worker con data de D1/KV
- **Personalizable:** Desde el panel admin del club
  - Logo, colores primario/secundario
  - Fotos (guardadas en R2)
  - Texto de bienvenida, horarios, ubicación (Google Maps embed)
  - Links a redes sociales
  - Botón "Reservar" → redirige a la app

```
Config en KV:
"site:icapadel" → {
  logo: "r2://tenants/icapadel/logo.png",
  primaryColor: "#1d5092",
  heroTitle: "Bienvenido a Ica Padel Club",
  heroSubtitle: "Las mejores canchas de pádel en Ica",
  address: "Av. San Martín 450, Ica",
  phone: "+51 956 123 456",
  instagram: "@icapadelclub.pe",
  hours: "Lun-Vie 6AM-10PM / Sáb-Dom 7AM-10PM",
  photos: ["r2://tenants/icapadel/photo1.jpg", ...]
}
```

## 4. Panel Lumini — `admin.padelclub.app`

- **Qué:** Panel interno para el equipo de Lumini
- **Dónde:** Cloudflare Pages (SPA separado, auth propia)
- **Funciones:**
  - Lista de todos los tenants (clubs)
  - Crear/suspender/eliminar tenants
  - Ver métricas por tenant (bookings, revenue, active users)
  - Feature flags por tenant
  - Billing: plan, fecha de pago, estado
  - Soporte: ver logs de un tenant, impersonar usuario
  - Provisionar subdominios y custom domains
  - Health check de la plataforma

## 5. API Backend — `api.padelclub.app`

- **Dónde:** Cloudflare Worker
- **Auth:** JWT (tokens firmados con Workers crypto)
- **Multi-tenancy:** Cada request incluye `x-tenant-id` (del subdomain) + JWT del usuario

```
api.padelclub.app/v1/courts         → Worker
    │
    Headers: Authorization: Bearer {jwt}
             x-tenant-id: t_abc
    │
    Worker:
    1. Valida JWT
    2. Extrae tenant_id del token (debe coincidir con header)
    3. Query D1: SELECT * FROM courts WHERE tenant_id = ?
    4. Responde JSON
```

### Endpoints principales

```
POST   /v1/auth/login
POST   /v1/auth/logout
POST   /v1/auth/reset-password

GET    /v1/courts
POST   /v1/courts
PUT    /v1/courts/:id
GET    /v1/courts/:id/schedule
PUT    /v1/courts/:id/schedule
GET    /v1/courts/:id/availability?date=YYYY-MM-DD
POST   /v1/courts/:id/blocks
DELETE /v1/courts/:id/blocks/:blockId

GET    /v1/members
POST   /v1/members
GET    /v1/members/:id
PUT    /v1/members/:id/status
GET    /v1/members/:id/transactions
POST   /v1/members/:id/credits

GET    /v1/bookings
POST   /v1/bookings
DELETE /v1/bookings/:id

GET    /v1/credit-prices
PUT    /v1/credit-prices

GET    /v1/site/config          → landing config
PUT    /v1/site/config          → update landing
POST   /v1/site/upload          → upload to R2

GET    /v1/dashboard/stats
GET    /v1/dashboard/chart-data
```

---

## Base de Datos — Cloudflare D1

**Estrategia:** Shared database con `tenant_id` en cada tabla.

D1 es SQLite en el edge. Para un SaaS con <200 clubs es más que suficiente (5M rows free, 25B reads/month free).

```sql
-- Tabla de tenants (la usa el panel Lumini)
CREATE TABLE tenants (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,      -- "icapadel"
  name        TEXT NOT NULL,             -- "Ica Padel Club"
  plan        TEXT DEFAULT 'starter',    -- starter/pro/enterprise
  status      TEXT DEFAULT 'active',     -- active/suspended/trial
  custom_domain TEXT,                    -- "app.icapadelclub.pe"
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Todas las demás tablas tienen tenant_id
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,   -- super_admin/staff/member
  status      TEXT DEFAULT 'active',
  password_hash TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email)
);

-- courts, bookings, members, credit_transactions, etc.
-- Todas con tenant_id + índice compuesto
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

**¿Por qué no DB por tenant?** D1 tiene un límite de databases por cuenta. Con tenant_id en shared DB:
- Más simple de migrar/mantener
- Queries siempre filtran por tenant_id (indexado)
- Un solo schema para todos
- Backup/restore es global

---

## Storage — Cloudflare KV + R2

### KV (config y cache)

```
tenant:icapadel           → { id, name, plan, status, features }
domain:app.icapadelclub.pe → "icapadel"
site:icapadel             → { logo, colors, texts, photos[] }
cache:courts:icapadel     → [courts JSON] (TTL: 60s)
cache:prices:icapadel     → [prices JSON] (TTL: 300s)
```

### R2 (archivos)

```
tenants/icapadel/logo.png
tenants/icapadel/photos/hero.jpg
tenants/icapadel/photos/court1.jpg
tenants/icapadel/photos/court2.jpg
```

---

## Custom Domains — Cloudflare for SaaS

Cloudflare for SaaS permite que cada club use su propio dominio:

1. Club configura en su panel: "Quiero usar app.icapadelclub.pe"
2. API crea un fallback origin en Cloudflare for SaaS
3. Club agrega CNAME: `app.icapadelclub.pe → icapadel.padelclub.app`
4. Cloudflare auto-provisiona SSL
5. Worker lee el hostname, busca en KV, resuelve el tenant

```
Panel Admin del Club:
  Dominio personalizado: [app.icapadelclub.pe]
  Estado: ✅ Verificado
  Instrucciones: Agrega este CNAME en tu DNS:
    app.icapadelclub.pe → icapadel.padelclub.app
```

---

## Async — Cloudflare Queues

```
Queue: notifications
  → Consumer Worker:
    - type: "booking_confirmed" → enviar email + WhatsApp
    - type: "welcome"           → enviar email de bienvenida
    - type: "monthly_reset"     → resetear créditos

Queue: webhooks
  → Consumer Worker:
    - type: "yape_payment"      → procesar pago
    - type: "plin_payment"      → procesar pago
```

Email: Resend (API, $0 hasta 100/día)
WhatsApp: Meta Business API o Twilio

---

## Deploy Pipeline

```
GitHub repo:
  /packages
    /marketing    → Cloudflare Pages (padelclub.app)
    /app          → Cloudflare Pages (*.padelclub.app)
    /admin        → Cloudflare Pages (admin.padelclub.app)
    /api          → Cloudflare Worker (api.padelclub.app)
    /landing-ssr  → Worker (sirve landings de clubs)
    /shared       → Types, utils compartidos

CI/CD: GitHub Actions
  push to main → deploy all services
  push to /packages/app → deploy solo app
```

Monorepo con **Turborepo** o pnpm workspaces.

---

## Costos estimados

### Cloudflare (pricing Mar 2026)

| Servicio | Free tier | Workers Paid ($5/mo) |
|---|---|---|
| Pages | 500 builds/mo | Unlimited |
| Workers | 100K req/día | 10M req/mo incluidos |
| D1 | 5M rows read/día, 100K write/día | 25B reads, 50M writes/mo |
| KV | 100K reads/día | 10M reads/mo |
| R2 | 10GB storage, 10M reads/mo | $0.015/GB/mo |
| Queues | 1M ops/mo | Incluido |
| For SaaS | — | $2/mo por custom domain |

### Proyección por escala

| Escala | Clubs | Users est. | Costo Cloudflare/mes | Costo email/WA | Total |
|---|---|---|---|---|---|
| Inicio | 10 | ~500 | $5 (Workers Paid) | $0–20 | **~$25** |
| Crecimiento | 50 | ~2,500 | $5 + ~$10 R2 + $100 custom domains | $50 | **~$165** |
| Escala | 200 | ~10,000 | $5 + ~$30 R2 + $400 custom domains | $150 | **~$585** |

**Revenue a 50 clubs × $100/mes = $5,000/mes → margen ~97%.**

---

## Resumen de servicios

| Servicio | URL | Infra | Tech |
|---|---|---|---|
| Marketing | padelclub.app | Pages | Astro |
| App SPA | {slug}.padelclub.app | Pages + Worker | React (Vite) |
| Landing Club | {slug}.padelclub.app/site | Worker SSR | HTML templates |
| API | api.padelclub.app | Worker | Hono/itty-router |
| Admin Lumini | admin.padelclub.app | Pages | React (Vite) |
| DB | — | D1 | SQLite |
| Cache/Config | — | KV | Key-Value |
| Files | — | R2 | Object storage |
| Async | — | Queues | Jobs |
| Custom domains | *.club.pe | For SaaS | SSL auto |

---

*Arquitectura diseñada: Marzo 2026 · Lumini · lumini.dev*
