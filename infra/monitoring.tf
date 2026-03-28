# ==============================================================================
# Monitoring & Alerting
# ==============================================================================
#
# Cloudflare provides built-in analytics for Workers, Pages, and D1.
# Access: https://dash.cloudflare.com > Workers & Pages > your worker > Analytics
#
# Recommended manual setup:
# 1. Notification policies (dash.cloudflare.com > Notifications):
#    - Workers: alert on error rate > 1%
#    - D1: alert on high read/write usage
#    - Pages: alert on deployment failures
#
# 2. Logpush (Enterprise) or Workers Trace Events:
#    - Enable via dashboard for real-time log streaming
#
# 3. External monitoring (optional):
#    - Uptime: Cloudflare Health Checks on api.canchapro.com/health
#    - Error tracking: Sentry via npm package in workers
# ==============================================================================

# ── Health check for API endpoint ────────────────────────────────────────────

resource "cloudflare_healthcheck" "api" {
  count          = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id        = var.cloudflare_zone_id
  name           = "CanchaPro API Health"
  description    = "Monitor API availability"
  address        = "api.${var.domain}"
  type           = "HTTPS"
  path           = "/health"
  port           = 443
  method         = "GET"
  expected_codes = ["200"]
  interval       = 60
  retries        = 2
  timeout        = 10
}
