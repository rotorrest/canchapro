# ── Cloudflare Pages Projects ─────────────────────────────────────────────────

# Web App (SPA for club admin/staff/member)
resource "cloudflare_pages_project" "web" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-web"
  production_branch = "main"

  build_config {
    build_command   = "cd web && npm run build"
    destination_dir = "web/dist"
  }
}

# Landing / Marketing site
resource "cloudflare_pages_project" "landing" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-landing"
  production_branch = "main"

  build_config {
    build_command   = "cd landing && npm run build"
    destination_dir = "landing/out"
  }
}

# Admin Panel (Lumini internal)
resource "cloudflare_pages_project" "admin" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-admin"
  production_branch = "main"

  build_config {
    build_command   = "cd packages/admin && npm run build"
    destination_dir = "packages/admin/dist"
  }
}

# Custom domains for Pages projects
resource "cloudflare_pages_domain" "landing_domain" {
  count      = var.cloudflare_zone_id != "" ? 1 : 0
  account_id = var.cloudflare_account_id
  project_name = cloudflare_pages_project.landing.name
  domain     = var.domain
}
