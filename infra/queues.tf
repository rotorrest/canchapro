# ── Queues ─────────────────────────────────────────────────────────────────────

resource "cloudflare_queue" "notifications" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-notifications-${var.environment}"
}
