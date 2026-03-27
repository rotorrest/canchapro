# ── DNS Records ───────────────────────────────────────────────────────────────

# API subdomain
resource "cloudflare_record" "api" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "api"
  content = "canchapro-api.workers.dev"
  type    = "CNAME"
  proxied = true
}

# Admin panel
resource "cloudflare_record" "admin" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "admin"
  content = "canchapro-admin.pages.dev"
  type    = "CNAME"
  proxied = true
}

# App subdomain (direct SPA access)
resource "cloudflare_record" "app" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "app"
  content = "canchapro-web.pages.dev"
  type    = "CNAME"
  proxied = true
}

# Wildcard for tenant subdomains → Router Worker
resource "cloudflare_record" "wildcard" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "*"
  content = "canchapro-router.workers.dev"
  type    = "CNAME"
  proxied = true
}
