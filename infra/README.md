# Infrastructure

Terraform configuration for all Cloudflare infrastructure.

## Files

| File | Purpose |
|------|---------|
| `main.tf` | Provider + backend |
| `variables.tf` | account_id, zone_id, domain, environment |
| `d1.tf` | Database |
| `kv.tf` | 3 KV namespaces (tenant, cache, site) |
| `r2.tf` | Upload bucket |
| `queues.tf` | Notification queue + DLQ |
| `dns.tf` | API, app, wildcard records |
| `workers.tf` | 3 workers with all bindings + routes + cron |
| `pages.tf` | Web + Landing Pages projects |
| `security.tf` | Rate limiting (auth 10/min, API 100/min) |
| `monitoring.tf` | Health check |
| `custom_hostnames.tf` | Cloudflare for SaaS |
| `outputs.tf` | All IDs needed for wrangler.toml |

## Usage

```
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Staging

```
terraform workspace new staging
```

Then change the `environment` variable.
