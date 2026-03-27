# ==============================================================================
# Queues
# ==============================================================================

# Primary notification queue: booking confirmations, reminders, WhatsApp
# messages, push notifications. Consumed by the API worker.
resource "cloudflare_queue" "notifications" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-notifications-${var.environment}"
}

# Dead-letter queue: messages that fail after max_retries land here for
# manual inspection or replay.
resource "cloudflare_queue" "notifications_dlq" {
  account_id = var.cloudflare_account_id
  name       = "canchapro-notifications-dlq-${var.environment}"
}
