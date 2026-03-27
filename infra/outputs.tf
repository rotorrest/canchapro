output "d1_database_id" {
  value       = cloudflare_d1_database.main.id
  description = "D1 database ID — paste into packages/api/wrangler.toml"
}

output "kv_tenant_id" {
  value       = cloudflare_workers_kv_namespace.tenant.id
  description = "KV namespace ID for tenant config"
}

output "kv_cache_id" {
  value       = cloudflare_workers_kv_namespace.cache.id
  description = "KV namespace ID for cache"
}

output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.uploads.name
  description = "R2 bucket name for uploads"
}

output "pages_web_url" {
  value       = "https://${cloudflare_pages_project.web.subdomain}"
  description = "Web app Pages URL"
}

output "pages_landing_url" {
  value       = "https://${cloudflare_pages_project.landing.subdomain}"
  description = "Landing Pages URL"
}

output "pages_admin_url" {
  value       = "https://${cloudflare_pages_project.admin.subdomain}"
  description = "Admin panel Pages URL"
}
