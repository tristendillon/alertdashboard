# Clerk production-instance DNS records (Clerk dashboard → Configure → Domains).
# These MUST stay DNS-only (proxied = false): Cloudflare proxying breaks Clerk's
# domain verification, the frontend-API CNAME, and DKIM signing.
# Targets must match the Clerk-issued values exactly — Clerk compares the observed
# CNAME target verbatim when verifying.
locals {
  clerk_dns_records = {
    accounts = {
      name   = "accounts.${local.web_hostname}"
      target = "accounts.clerk.services"
    }
    frontend = {
      name   = "clerk.${local.web_hostname}"
      target = "frontend-api.clerk.services"
    }
    dkim1 = {
      name   = "clk._domainkey.${local.web_hostname}"
      target = "dkim1.${local.clerk_instance_slug}.clerk.services"
    }
    dkim2 = {
      name   = "clk2._domainkey.${local.web_hostname}"
      target = "dkim2.${local.clerk_instance_slug}.clerk.services"
    }
    mail = {
      name   = "clkmail.${local.web_hostname}"
      target = "mail.${local.clerk_instance_slug}.clerk.services"
    }
  }
}

resource "cloudflare_dns_record" "clerk" {
  for_each = local.clerk_dns_records

  zone_id = data.cloudflare_zone.this.zone_id
  name    = each.value.name
  type    = "CNAME"
  content = each.value.target
  ttl     = 300
  proxied = false
  comment = "Clerk production instance (managed by OpenTofu)"
}
