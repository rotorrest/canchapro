# ==============================================================================
# Outputs
# ==============================================================================
#
# These values are needed to fill in each package's wrangler.toml.
# After `terraform apply`, run `terraform output` to see them.
# ==============================================================================

# ── D1 ───────────────────────────────────────────────────────────────────────

output "d1_database_id" {
  value       = cloudflare_d1_database.main.id
  description = "D1 database ID -> packages/api/wrangler.toml [[d1_databases]] database_id"
}

output "d1_database_name" {
  value       = cloudflare_d1_database.main.name
  description = "D1 database name"
}

# ── KV ───────────────────────────────────────────────────────────────────────

output "kv_tenant_id" {
  value       = cloudflare_workers_kv_namespace.tenant.id
  description = "TENANT_KV namespace ID -> wrangler.toml [[kv_namespaces]] id"
}

output "kv_cache_id" {
  value       = cloudflare_workers_kv_namespace.cache.id
  description = "CACHE_KV namespace ID -> wrangler.toml [[kv_namespaces]] id"
}

# ── R2 ───────────────────────────────────────────────────────────────────────

output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.uploads.name
  description = "R2 bucket name -> wrangler.toml [[r2_buckets]] bucket_name"
}

# ── Queues ───────────────────────────────────────────────────────────────────

output "queue_notifications_id" {
  value       = cloudflare_queue.notifications.id
  description = "Notifications queue ID"
}

output "queue_notifications_name" {
  value       = cloudflare_queue.notifications.name
  description = "Notifications queue name -> wrangler.toml [[queues.producers]] queue"
}

output "queue_notifications_dlq_id" {
  value       = cloudflare_queue.notifications_dlq.id
  description = "Notifications dead-letter queue ID"
}

output "queue_notifications_dlq_name" {
  value       = cloudflare_queue.notifications_dlq.name
  description = "Notifications DLQ name -> wrangler.toml dead_letter_queue"
}

# ── Workers ──────────────────────────────────────────────────────────────────

output "worker_api_name" {
  value       = cloudflare_worker_script.api.name
  description = "API worker script name"
}

output "worker_router_name" {
  value       = cloudflare_worker_script.router.name
  description = "Router worker script name"
}

output "worker_club_site_name" {
  value       = cloudflare_worker_script.club_site.name
  description = "Club-site worker script name"
}

# ── Pages ────────────────────────────────────────────────────────────────────

output "pages_web_url" {
  value       = "https://${cloudflare_pages_project.web.subdomain}"
  description = "Web dashboard Pages URL"
}

output "pages_landing_url" {
  value       = "https://${cloudflare_pages_project.landing.subdomain}"
  description = "Landing site Pages URL"
}

output "pages_admin_url" {
  value       = "https://${cloudflare_pages_project.admin.subdomain}"
  description = "Admin panel Pages URL"
}

# ── DNS ──────────────────────────────────────────────────────────────────────

output "api_endpoint" {
  value       = local.manage_dns ? "https://api.${var.domain}" : "https://${cloudflare_worker_script.api.name}.workers.dev"
  description = "API base URL"
}

output "app_endpoint" {
  value       = local.manage_dns ? "https://app.${var.domain}" : "https://${cloudflare_pages_project.web.subdomain}"
  description = "Web app URL"
}

# ── Composite: wrangler.toml cheat sheet ─────────────────────────────────────

output "wrangler_bindings_summary" {
  value = <<-EOT

    ============================================
    Copy these into your wrangler.toml files:
    ============================================

    packages/api/wrangler.toml:
      database_id        = "${cloudflare_d1_database.main.id}"
      TENANT_KV id       = "${cloudflare_workers_kv_namespace.tenant.id}"
      CACHE_KV id        = "${cloudflare_workers_kv_namespace.cache.id}"
      bucket_name        = "${cloudflare_r2_bucket.uploads.name}"
      queue              = "${cloudflare_queue.notifications.name}"
      dead_letter_queue  = "${cloudflare_queue.notifications_dlq.name}"

    packages/router/wrangler.toml:
      TENANT_KV id       = "${cloudflare_workers_kv_namespace.tenant.id}"
      bucket_name        = "${cloudflare_r2_bucket.uploads.name}"

    packages/club-site/wrangler.toml:
      TENANT_KV id       = "${cloudflare_workers_kv_namespace.tenant.id}"
      bucket_name        = "${cloudflare_r2_bucket.uploads.name}"

  EOT
  description = "Quick reference for wrangler.toml bindings"
}
