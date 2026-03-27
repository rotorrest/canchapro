# ── R2 Bucket ─────────────────────────────────────────────────────────────────

resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-uploads-${var.environment}"
  location   = "WNAM" # West North America (closest to LATAM)
}
