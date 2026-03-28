# Router Worker

Cloudflare Worker that routes incoming requests on `*.canchapro.com` to the correct destination.

## Routing logic

```
*.canchapro.com/app/*     → SPA (Cloudflare Pages)
*.canchapro.com/uploads/* → R2 bucket (images, logos)
*.canchapro.com/          → Club-Site Worker (SSR landing)
custom-domain.com/*       → Same as above (resolved via TENANT_KV)
```

Reserved subdomains (not routed to clubs): `api`, `admin`, `app`, `www`.

## Bindings

| Binding | Type | Purpose |
|---|---|---|
| `TENANT_KV` | KV | Resolve slug → tenantId |
| `UPLOADS` | R2 | Serve uploaded files |
| `WEB_APP_URL` | Env var | Pages URL for SPA redirect |

## Files

- `src/index.ts` — Main router logic
- `src/template.ts` — Fallback HTML template (if club-site unavailable)

## Deploy

```bash
wrangler deploy --env production
```
