# ==============================================================================
# KV Namespaces
# ==============================================================================

# Tenant configuration: club settings, branding, feature flags.
# Read by the API worker and the router/club-site workers.
resource "cloudflare_workers_kv_namespace" "tenant" {
  account_id = var.cloudflare_account_id
  title      = "canchapro-tenant-kv-${var.environment}"
}

# General-purpose cache: session data, rate-limit counters, booking
# availability snapshots. Short TTL entries managed by the API worker.
resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.cloudflare_account_id
  title      = "canchapro-cache-kv-${var.environment}"
}
