# ==============================================================================
# Variables
# ==============================================================================

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token with Workers, D1, KV, R2, DNS, Queues, Pages permissions"
  sensitive   = true

  validation {
    condition     = length(var.cloudflare_api_token) >= 20 && var.cloudflare_api_token != "your-api-token-here"
    error_message = "Provide a valid Cloudflare API token. Copy terraform.tfvars.example to terraform.tfvars and fill in your real token."
  }
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"

  validation {
    condition     = length(var.cloudflare_account_id) >= 10 && var.cloudflare_account_id != "your-account-id-here"
    error_message = "Provide a valid Cloudflare account ID."
  }
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Zone ID for the primary domain (canchapro.com). Leave empty to skip DNS/route resources."
  default     = ""
}

variable "domain" {
  type        = string
  description = "Primary domain name"
  default     = "canchapro.com"
}

variable "environment" {
  type        = string
  description = "Deployment environment (production, staging, dev)"
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: production, staging, dev."
  }
}

# ── Worker source paths ──────────────────────────────────────────────────────

variable "api_worker_script_path" {
  type        = string
  description = "Path to the compiled API worker entry point (output of wrangler build / esbuild)"
  default     = "../packages/api/dist/index.js"
}

variable "router_worker_script_path" {
  type        = string
  description = "Path to the compiled Router worker entry point"
  default     = "../packages/router/dist/index.js"
}

variable "club_site_worker_script_path" {
  type        = string
  description = "Path to the compiled Club-Site worker entry point"
  default     = "../packages/club-site/dist/index.js"
}
