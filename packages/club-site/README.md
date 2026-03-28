# Club-Site Worker

Server-side renders branded landing pages for each club. Each tenant gets their own public website at `slug.canchapro.com` or a custom domain.

## How it works

1. Router Worker forwards request here
2. Resolves tenant slug from subdomain or custom domain (via TENANT_KV)
3. Fetches branding (logo, colors, title, photos) from KV or D1
4. Renders HTML using `template.ts`
5. Serves with Tailwind CSS (inline) and dynamic brand colors

## Future: Site Builder

The infra already provisions `SITE_KV` for pre-rendered HTML. When the site builder feature is implemented:
1. Admin edits pages in the dashboard
2. API saves rendered HTML to `SITE_KV` key: `site:{slug}:{page}:html`
3. This worker checks SITE_KV first, falls back to template.ts

## Bindings

| Binding | Type | Purpose |
|---|---|---|
| `TENANT_KV` | KV | Tenant config + branding |
| `SITE_KV` | KV | Pre-rendered HTML (future site builder) |
| `UPLOADS` | R2 | Club photos and logos |
| `API_URL` | Env var | Backend API URL |

## Files

- `src/index.ts` — Hono app, resolves tenant, serves page
- `src/template.ts` — HTML template with dynamic branding

## Deploy

```bash
wrangler deploy --env production
```
