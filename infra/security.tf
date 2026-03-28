# ==============================================================================
# Security -- Rate Limiting & WAF Rules
# ==============================================================================
#
# Cloudflare WAF custom rules for rate limiting. These protect authentication
# endpoints from brute-force attacks and apply a general rate limit to the
# entire API surface.
#
# Only created when cloudflare_zone_id is configured.
# ==============================================================================

# ── Rate limit auth endpoints: 10 req/min per IP ────────────────────────────

resource "cloudflare_ruleset" "rate_limit_auth" {
  count       = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id     = var.cloudflare_zone_id
  name        = "Rate limit auth endpoints"
  description = "Protect login/register from brute force"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action = "block"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 10
      mitigation_timeout  = 300
    }
    expression  = "(http.request.uri.path contains \"/v1/auth/login\" or http.request.uri.path contains \"/v1/auth/register\" or http.request.uri.path contains \"/v1/auth/forgot-password\")"
    description = "Rate limit auth: 10 req/min per IP"
    enabled     = true
  }
}

# ── Rate limit general API: 100 req/min per IP ──────────────────────────────

resource "cloudflare_ruleset" "rate_limit_api" {
  count       = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id     = var.cloudflare_zone_id
  name        = "Rate limit API"
  description = "General API rate limiting"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action = "block"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 100
      mitigation_timeout  = 60
    }
    expression  = "(http.request.uri.path contains \"/v1/\")"
    description = "Rate limit API: 100 req/min per IP"
    enabled     = true
  }
}
