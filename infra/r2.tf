# ==============================================================================
# R2 Bucket
# ==============================================================================

# Stores club logos, court photos, user avatars, receipt images,
# and site builder media (hero backgrounds, gallery images, team photos).
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-uploads-${var.environment}"
  location   = "WNAM" # West North America -- lowest latency to Peru/LATAM
}
