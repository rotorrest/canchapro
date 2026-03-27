# ==============================================================================
# Cloudflare Pages Projects
# ==============================================================================
#
# Pages projects host static SPAs. Actual deployments happen via
# `wrangler pages deploy` in CI -- Terraform only creates the project
# containers and custom domain bindings.
# ==============================================================================

# ── Web Dashboard (SPA for club admin/staff/members) ─────────────────────────
resource "cloudflare_pages_project" "web" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-web-${var.environment}"
  production_branch = "main"

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "packages/web"
  }

  deployment_configs {
    production {
      environment_variables = {
        VITE_API_URL     = "https://api.${var.domain}"
        VITE_ENVIRONMENT = var.environment
      }
    }
    preview {
      environment_variables = {
        VITE_API_URL     = "https://api.${var.domain}"
        VITE_ENVIRONMENT = "preview"
      }
    }
  }
}

# ── Landing / Marketing Site ─────────────────────────────────────────────────
resource "cloudflare_pages_project" "landing" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-landing-${var.environment}"
  production_branch = "main"

  build_config {
    build_command   = "npm run build"
    destination_dir = "out"
    root_dir        = "packages/landing"
  }

  deployment_configs {
    production {
      environment_variables = {
        NEXT_PUBLIC_API_URL = "https://api.${var.domain}"
      }
    }
    preview {
      environment_variables = {
        NEXT_PUBLIC_API_URL = "https://api.${var.domain}"
      }
    }
  }
}

# ── Admin Panel (Lumini internal super-admin) ────────────────────────────────
resource "cloudflare_pages_project" "admin" {
  account_id        = var.cloudflare_account_id
  name              = "canchapro-admin-${var.environment}"
  production_branch = "main"

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "packages/admin"
  }

  deployment_configs {
    production {
      environment_variables = {
        VITE_API_URL     = "https://api.${var.domain}"
        VITE_ENVIRONMENT = var.environment
      }
    }
    preview {
      environment_variables = {
        VITE_API_URL     = "https://api.${var.domain}"
        VITE_ENVIRONMENT = "preview"
      }
    }
  }
}

# ── Custom Domains for Pages Projects ────────────────────────────────────────

resource "cloudflare_pages_domain" "web_app" {
  count        = local.manage_dns ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.web.name
  domain       = "app.${var.domain}"
}

resource "cloudflare_pages_domain" "landing_root" {
  count        = local.manage_dns ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.landing.name
  domain       = var.domain
}

resource "cloudflare_pages_domain" "admin_panel" {
  count        = local.manage_dns ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.admin.name
  domain       = "admin.${var.domain}"
}
