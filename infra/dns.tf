# ==============================================================================
# DNS Records
# ==============================================================================
#
# All records are proxied through Cloudflare (orange-cloud) so that Workers
# routes and SSL termination work correctly.
#
# These are only created when cloudflare_zone_id is provided.
# ==============================================================================

locals {
  manage_dns = var.cloudflare_zone_id != ""
}

# ── api.canchapro.com ── points to the API worker
resource "cloudflare_record" "api" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "api"
  content = "100::" # Proxied dummy AAAA -- Cloudflare intercepts via Worker Route
  type    = "AAAA"
  proxied = true
  ttl     = 1 # Auto (managed by Cloudflare when proxied)
  comment = "API Worker endpoint"
}

# ── app.canchapro.com ── points to the web dashboard (Pages project)
resource "cloudflare_record" "app" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "app"
  content = cloudflare_pages_project.web.subdomain
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Web dashboard (Pages)"
}

# ── *.canchapro.com ── wildcard for tenant subdomains, points to Router Worker
resource "cloudflare_record" "wildcard" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "*"
  content = "100::" # Proxied dummy AAAA -- Cloudflare intercepts via Worker Route
  type    = "AAAA"
  proxied = true
  ttl     = 1
  comment = "Wildcard for tenant subdomains -> Router Worker"
}

# ── fallback.canchapro.com ── fallback origin for Cloudflare for SaaS
resource "cloudflare_record" "fallback" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "fallback"
  content = "100::" # Proxied dummy AAAA -- Router Worker handles the request
  type    = "AAAA"
  proxied = true
  ttl     = 1
  comment = "Fallback origin for custom hostnames (SaaS)"
}

# ── Root domain ── landing/marketing site (Pages project)
resource "cloudflare_record" "root" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = cloudflare_pages_project.landing.subdomain
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Landing site (Pages)"
}
