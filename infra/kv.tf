# ── KV Namespaces ─────────────────────────────────────────────────────────────

resource "cloudflare_workers_kv_namespace" "tenant" {
  account_id = var.cloudflare_account_id
  title      = "canchapro-tenant-${var.environment}"
}

resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.cloudflare_account_id
  title      = "canchapro-cache-${var.environment}"
}
