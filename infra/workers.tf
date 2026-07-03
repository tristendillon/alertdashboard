# Look up the existing zone by name. The custom-domain resources below create the
# necessary DNS records + edge certificates automatically, so no cloudflare_dns_record
# resources are needed for the Workers (Clerk's records live in clerk.tf).
data "cloudflare_zone" "this" {
  filter = {
    name = var.zone_name
  }
}

# Binds the web Worker to its production custom domain.
# The Worker script itself must already be deployed by wrangler before this applies.
# NOTE: no `environment` attribute — it is deprecated, and wrangler-deployed Workers
# have no legacy environments; setting it fails with API error 10092.
resource "cloudflare_workers_custom_domain" "web" {
  account_id = var.account_id
  zone_id    = data.cloudflare_zone.this.zone_id
  hostname   = var.web_hostname
  service    = var.web_worker_name
}

# Binds the listener Worker to its production custom domain.
resource "cloudflare_workers_custom_domain" "listener" {
  account_id = var.account_id
  zone_id    = data.cloudflare_zone.this.zone_id
  hostname   = var.listener_hostname
  service    = var.listener_worker_name
}
