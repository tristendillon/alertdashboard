# Clerk production-instance DNS records (Clerk dashboard → Configure → Domains).
# These MUST stay DNS-only (proxied = false): Cloudflare proxying breaks Clerk's
# domain verification, the frontend-API CNAME, and DKIM signing.
# Targets must match the Clerk-issued values exactly — Clerk compares the observed
# CNAME target verbatim when verifying.
locals {
  clerk_dns_records = {
    accounts = {
      name   = "accounts.${var.web_hostname}"
      target = "accounts.clerk.services"
    }
    frontend = {
      name   = "clerk.${var.web_hostname}"
      target = "frontend-api.clerk.services"
    }
    dkim1 = {
      name   = "clk._domainkey.${var.web_hostname}"
      target = "dkim1.${var.clerk_instance_slug}.clerk.services"
    }
    dkim2 = {
      name   = "clk2._domainkey.${var.web_hostname}"
      target = "dkim2.${var.clerk_instance_slug}.clerk.services"
    }
    mail = {
      name   = "clkmail.${var.web_hostname}"
      target = "mail.${var.clerk_instance_slug}.clerk.services"
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
