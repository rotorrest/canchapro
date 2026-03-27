# ==============================================================================
# Cloudflare for SaaS -- Custom Hostnames
# ==============================================================================
#
# Enables clubs to use their own vanity domains (e.g., icapadelclub.pe)
# instead of the default tenant subdomain (e.g., ica.canchapro.com).
#
# How it works:
#   1. Terraform sets up the fallback origin (fallback.canchapro.com) which
#      points to the Router Worker via a proxied DNS record (see dns.tf).
#   2. When a club admin enables a custom domain through the app, the API
#      worker calls the Cloudflare API to create a custom hostname:
#
#        POST /zones/{zone_id}/custom_hostnames
#        {
#          "hostname": "reservas.icapadelclub.pe",
#          "ssl": { "method": "http", "type": "dv" },
#          "custom_metadata": { "tenant_id": "ica-padel" }
#        }
#
#   3. The club's DNS admin adds a CNAME pointing their domain to
#      fallback.canchapro.com.
#   4. Cloudflare provisions a DV SSL certificate automatically.
#   5. The Router Worker reads the Host header and resolves the tenant
#      via TENANT_KV to serve the correct club site.
#
# Individual custom hostnames are NOT managed by Terraform -- they are
# dynamic and created/removed via the API at runtime.
# ==============================================================================

resource "cloudflare_custom_hostname_fallback_origin" "saas" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  origin  = "fallback.${var.domain}"
}

# The SSL settings on the zone to support custom hostnames
resource "cloudflare_zone_settings_override" "ssl" {
  count   = local.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "full"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
  }
}
