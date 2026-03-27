# ==============================================================================
# CanchaPro Infrastructure -- Cloudflare
# ==============================================================================
#
# This Terraform configuration provisions the complete Cloudflare infrastructure
# for CanchaPro, a multi-tenant SaaS booking platform for padel clubs.
#
# Resources managed:
#   - D1 Database (primary data store)
#   - KV Namespaces (tenant config + cache)
#   - R2 Bucket (file uploads)
#   - Queues (notifications + dead-letter queue)
#   - Workers (API, router, club-site)
#   - DNS records (api, app, wildcard for tenant subdomains)
#   - Cloudflare for SaaS (custom hostname support for tenant domains)
#   - Pages projects (web dashboard, landing site, admin panel)
#
# Setup:
#   1. Copy terraform.tfvars.example to terraform.tfvars
#   2. Fill in your Cloudflare API token, account ID, and zone ID
#   3. Run: terraform init
#   4. Run: terraform plan
#   5. Run: terraform apply
#   6. Copy the output IDs into each package's wrangler.toml
#
# API Token Permissions Required:
#   - Account: Workers Scripts (Edit), D1 (Edit), Workers KV Storage (Edit),
#     Workers R2 Storage (Edit), Queues (Edit), Pages (Edit)
#   - Zone: DNS (Edit), SSL and Certificates (Edit), Workers Routes (Edit)
#
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
