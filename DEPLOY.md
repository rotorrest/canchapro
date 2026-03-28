# CanchaPro — Deploy Roadmap

## Prerequisites

- [ ] Cloudflare account (Workers Paid plan, $5/mo)
- [ ] Domain `canchapro.com` added to Cloudflare DNS
- [ ] API Token with permissions: Workers Scripts, D1, KV, R2, Queues, Pages, DNS, SSL
- [ ] Terraform >= 1.5 installed
- [ ] Node.js >= 20, pnpm >= 9
- [ ] GitHub repo (for CI/CD)

## Step 1: Configure Terraform (5 min)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
cloudflare_api_token  = "your-real-token"
cloudflare_account_id = "your-account-id"     # Dashboard > Overview > right sidebar
cloudflare_zone_id    = "your-zone-id"         # Dashboard > your domain > Overview > right sidebar
domain                = "canchapro.com"
environment           = "production"
```

## Step 2: Create Infrastructure (5 min)

```bash
cd infra
terraform init
terraform plan          # Review what will be created
terraform apply         # Create all resources
```

This creates:
- D1 database `canchapro-db-production`
- KV namespaces: TENANT_KV, CACHE_KV, SITE_KV
- R2 bucket `canchapro-uploads-production`
- Queues: `canchapro-notifications` + DLQ
- DNS records: `api.`, `app.`, `*.` (wildcard)
- Pages projects: web dashboard, landing site
- Worker routes for API and router
- Rate limiting rules (auth: 10/min, API: 100/min)
- Health check on api.canchapro.com/health
- Cloudflare for SaaS (custom hostname support)

## Step 3: Copy Resource IDs to wrangler.toml (5 min)

```bash
terraform output
```

Copy the output values into `packages/api/wrangler.toml` `[env.production]` section:

```toml
[env.production]
vars = { ENVIRONMENT = "production", DOMAIN = "canchapro.com" }

[[env.production.d1_databases]]
database_id = "<d1_database_id from terraform output>"

[[env.production.kv_namespaces]]
binding = "TENANT_KV"
id = "<kv_tenant_id>"

[[env.production.kv_namespaces]]
binding = "CACHE_KV"
id = "<kv_cache_id>"

# ... etc
```

Do the same for `packages/router/wrangler.toml` and `packages/club-site/wrangler.toml`.

## Step 4: Set Production Secrets (2 min)

```bash
cd packages/api

# Generate a strong secret
openssl rand -base64 32

# Set it
wrangler secret put JWT_SECRET --env production
# Paste the generated secret when prompted
```

## Step 5: Deploy Database Schema + Seed (5 min)

```bash
cd packages/api

# Run schema migrations
wrangler d1 migrations apply canchapro-db --remote --env production

# Generate seed with real password hashes
node scripts/generate-seed.mjs > /tmp/prod-seed.sql

# Apply seed (ONLY for first deploy — skip for existing databases)
wrangler d1 execute canchapro-db --remote --env production --file=/tmp/prod-seed.sql

# Fix password hashes (seed uses __SEED_HASH__ placeholders)
node -e "
const c=require('crypto');
['u0','u1','u2','u3','u4','u10','u11','u12','u13'].forEach(id=>{
  const h=c.createHash('sha256').update('admin123'+id).digest('base64');
  console.log(\"UPDATE users SET password_hash = '\"+h+\"' WHERE id = '\"+id+\"';\");
});" | wrangler d1 execute canchapro-db --remote --env production --file=-

# Verify
wrangler d1 execute canchapro-db --remote --env production \
  --command="SELECT id, email, role FROM users LIMIT 5"
```

## Step 6: Deploy Workers (5 min)

```bash
# Install deps
pnpm install

# Deploy API (includes queue consumer + cron triggers)
cd packages/api && wrangler deploy --env production

# Deploy Router (subdomain routing)
cd ../router && wrangler deploy --env production

# Deploy Club-Site (SSR club pages)
cd ../club-site && wrangler deploy --env production
```

## Step 7: Deploy Web Apps (5 min)

```bash
# Build & deploy web dashboard
cd web
VITE_API_URL=https://api.canchapro.com npx vite build
wrangler pages deploy dist --project-name=canchapro-web-production

# Build & deploy landing page
cd ../landing
npm run build
wrangler pages deploy out --project-name=canchapro-landing-production
```

## Step 8: Verify (5 min)

```bash
# Health check
curl https://api.canchapro.com/health

# Login
curl https://api.canchapro.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: t1" \
  -d '{"email":"admin@icademo.com","password":"admin123"}'

# Open web dashboard
open https://app.canchapro.com

# Open landing page
open https://canchapro.com
```

## Step 9: Configure CI/CD (10 min)

In your GitHub repo settings, add secrets:
- `CLOUDFLARE_ACCOUNT_ID` → your account ID
- `CLOUDFLARE_API_TOKEN` → your API token

The workflow at `.github/workflows/deploy.yml` runs on push to `main`:
1. Type-checks the frontend
2. Deploys API, Router, Club-Site workers in parallel
3. Builds and deploys Web + Landing to Pages
4. Runs D1 migrations

## Step 10: Post-Deploy Checklist

- [ ] Change all seed passwords (admin123 is for demo only)
- [ ] Verify rate limiting is active (Dashboard > Security > WAF)
- [ ] Set up notification policies (Dashboard > Notifications)
- [ ] Test booking flow end-to-end on production
- [ ] Configure WhatsApp Business API when ready
- [ ] Add real club data (replace demo tenants)

## Architecture After Deploy

```
canchapro.com          → Landing (Pages)
app.canchapro.com      → Web Dashboard (Pages)
api.canchapro.com      → API Worker (D1, KV, R2, Queue)
*.canchapro.com        → Router Worker → Club-Site Worker
clubcustom.com         → Cloudflare for SaaS → Router → Club-Site
```

## Costs

| Scale | Workers | D1 | R2 | KV | Custom Domains | Total |
|---|---|---|---|---|---|---|
| Start (5 clubs) | $5 | included | included | included | $10 | **$15/mo** |
| Growth (50 clubs) | $5 | included | $0.15 | included | $100 | **$105/mo** |
| Scale (200 clubs) | $5 | included | $3 | included | $400 | **$408/mo** |

All within the Workers Paid plan ($5/mo). D1, KV, R2 free tiers are generous.

## Staging Environment

```bash
# Create staging infra
cd infra
terraform workspace new staging
# Edit terraform.tfvars: environment = "staging"
terraform apply

# Deploy to staging
cd packages/api && wrangler deploy --env staging
cd web && VITE_API_URL=https://api-staging.canchapro.com npx vite build
wrangler pages deploy dist --project-name=canchapro-web-staging
```
