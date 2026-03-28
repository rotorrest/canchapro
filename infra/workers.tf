# ==============================================================================
# Workers
# ==============================================================================
#
# Worker scripts are deployed via `wrangler deploy` in CI, but Terraform
# manages the script resources so that bindings (D1, KV, R2, Queues) and
# routes are declared as code and stay in sync.
#
# Build each worker before running terraform apply:
#   cd packages/api   && npm run build
#   cd packages/router && npm run build
#   cd packages/club-site && npm run build
# ==============================================================================

# ── API Worker ────────────────────────────────────────────────────────────────
# The main backend: handles REST API, cron triggers, queue consumers.

resource "cloudflare_worker_script" "api" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-api-${var.environment}"
  content    = file(var.api_worker_script_path)
  module     = true

  # ── D1 binding ──
  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.main.id
  }

  # ── KV bindings ──
  kv_namespace_binding {
    name         = "TENANT_KV"
    namespace_id = cloudflare_workers_kv_namespace.tenant.id
  }

  kv_namespace_binding {
    name         = "CACHE_KV"
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }

  # ── R2 binding ──
  r2_bucket_binding {
    name        = "UPLOADS"
    bucket_name = cloudflare_r2_bucket.uploads.name
  }

  # ── Queue producer binding ──
  queue_binding {
    binding = "NOTIFICATIONS_QUEUE"
    queue   = cloudflare_queue.notifications.name
  }

  # ── Queue consumer binding ──
  queue_consumer_binding {
    queue_name        = cloudflare_queue.notifications.name
    max_batch_size    = 10
    max_batch_timeout = 30
    max_retries       = 3
    dead_letter_queue = cloudflare_queue.dlq.name
  }

  # ── Environment variables ──
  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
}

# ── API Worker Route ──────────────────────────────────────────────────────────
resource "cloudflare_worker_route" "api" {
  count       = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id     = var.cloudflare_zone_id
  pattern     = "api.${var.domain}/*"
  script_name = cloudflare_worker_script.api.name
}

# ── API Worker Cron Triggers ─────────────────────────────────────────────────
resource "cloudflare_worker_cron_trigger" "api_crons" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker_script.api.name
  schedules = [
    "0 * * * *", # Every hour: booking reminders
    "0 0 1 * *", # 1st of month midnight: monthly credit reset
  ]
}

# ── Router Worker ─────────────────────────────────────────────────────────────
# Routes tenant subdomain requests (*.canchapro.com) and custom hostname
# traffic to the correct club-site or the web app.

resource "cloudflare_worker_script" "router" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-router-${var.environment}"
  content    = file(var.router_worker_script_path)
  module     = true

  kv_namespace_binding {
    name         = "TENANT_KV"
    namespace_id = cloudflare_workers_kv_namespace.tenant.id
  }

  r2_bucket_binding {
    name        = "UPLOADS"
    bucket_name = cloudflare_r2_bucket.uploads.name
  }

  plain_text_binding {
    name = "WEB_APP_URL"
    text = local.manage_dns ? "https://app.${var.domain}" : "https://${cloudflare_pages_project.web.subdomain}"
  }

  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
}

# ── Router Worker Route (wildcard subdomains) ─────────────────────────────────
resource "cloudflare_worker_route" "router_wildcard" {
  count       = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id     = var.cloudflare_zone_id
  pattern     = "*.${var.domain}/*"
  script_name = cloudflare_worker_script.router.name
}

# ── Club-Site Worker ──────────────────────────────────────────────────────────
# Renders the public-facing club website / booking page for each tenant.

resource "cloudflare_worker_script" "club_site" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-club-site-${var.environment}"
  content    = file(var.club_site_worker_script_path)
  module     = true

  kv_namespace_binding {
    name         = "TENANT_KV"
    namespace_id = cloudflare_workers_kv_namespace.tenant.id
  }

  r2_bucket_binding {
    name        = "UPLOADS"
    bucket_name = cloudflare_r2_bucket.uploads.name
  }

  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }

  plain_text_binding {
    name = "API_URL"
    text = local.manage_dns ? "https://api.${var.domain}" : "https://canchapro-api-${var.environment}.workers.dev"
  }
}
