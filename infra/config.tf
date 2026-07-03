# Single source of truth for account-, domain-, and instance-specific values:
# deploy.config.json at the repo root. The same file is read by the GitHub Actions
# workflows (jq) — edit it there, not here. See docs/porting.md.
locals {
  cfg = jsondecode(file("${path.module}/../deploy.config.json"))

  zone_name            = local.cfg.zoneName
  web_worker_name      = local.cfg.webWorkerName
  listener_worker_name = local.cfg.listenerWorkerName
  web_hostname         = local.cfg.webHostname
  listener_hostname    = local.cfg.listenerHostname
  clerk_instance_slug  = local.cfg.clerkInstanceSlug
}

# The one value not in deploy.config.json: the Cloudflare account id. CI derives it
# from the zone via the API (GET /zones?name=<zone> -> .result[0].account.id) and
# passes it as TF_VAR_account_id; locally, export TF_VAR_account_id yourself.
variable "account_id" {
  type        = string
  description = "Cloudflare account id that owns the zone and workers (derived from the zone in CI)."
}
