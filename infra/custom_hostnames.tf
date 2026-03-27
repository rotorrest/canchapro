# ── Cloudflare for SaaS (Custom Hostnames) ────────────────────────────────────
#
# This enables clubs to use their own domains (e.g., icapadelclub.pe).
# Custom hostnames are managed dynamically via the Cloudflare API when a
# club configures their domain in the admin panel.
#
# The API Worker calls:
#   POST /zones/{zone_id}/custom_hostnames
#   { "hostname": "icapadelclub.pe", "ssl": { "method": "http", "type": "dv" } }
#
# Terraform manages the fallback origin:

resource "cloudflare_custom_hostname_fallback_origin" "saas" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  origin  = "fallback.${var.domain}"
}

# DNS record for fallback origin → Router Worker
resource "cloudflare_record" "fallback" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "fallback"
  content = "canchapro-router.workers.dev"
  type    = "CNAME"
  proxied = true
}
