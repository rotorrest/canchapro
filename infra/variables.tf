variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token with Workers, D1, KV, R2, DNS permissions"
  sensitive   = true
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Zone ID for canchapro.com"
  default     = ""
}

variable "domain" {
  type        = string
  description = "Primary domain"
  default     = "canchapro.com"
}

variable "environment" {
  type        = string
  description = "Environment (production, staging)"
  default     = "production"
}
