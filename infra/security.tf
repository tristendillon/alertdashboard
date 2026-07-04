# Free-tier bot / scanner hardening for the proxied hosts in this zone.
# The web + listener custom domains are orange-clouded (see workers.tf), so
# these zone rulesets apply to them; Clerk's CNAMEs are DNS-only and bypass the
# proxy, so they're unaffected. No regex `matches` operator is used — that needs
# a Business plan; `contains`/`ends_with`/`lower()` work on Free.

# Custom firewall rules (WAF).
resource "cloudflare_ruleset" "waf_custom" {
  zone_id = data.cloudflare_zone.this.zone_id
  name    = "alertdashboard custom firewall"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      description = "Block common scanner / exploit paths (app never serves these)"
      action      = "block"
      enabled     = true
      expression = join(" or ", [
        "(lower(http.request.uri.path) contains \"/wp-admin\")",
        "(lower(http.request.uri.path) contains \"/wp-login\")",
        "(lower(http.request.uri.path) contains \"xmlrpc.php\")",
        "(ends_with(lower(http.request.uri.path), \".php\"))",
        "(lower(http.request.uri.path) contains \"/.env\")",
        "(lower(http.request.uri.path) contains \"/.git\")",
        "(lower(http.request.uri.path) contains \"/phpmyadmin\")",
        "(lower(http.request.uri.path) contains \"/vendor/\")",
        "(lower(http.request.uri.path) contains \"/.aws\")",
        "(lower(http.request.uri.path) contains \"/.ssh\")",
      ])
    },
    {
      description = "Managed-challenge automated traffic to the admin surface"
      action      = "managed_challenge"
      enabled     = true
      expression  = "(http.host eq \"${local.web_hostname}\" and starts_with(http.request.uri.path, \"/dashboard\"))"
    },
  ]
}

# Per-IP rate limiting on the web host. Excludes static assets and the RSS feed
# so kiosks and feed readers are never throttled; a single page load is far
# under the threshold, aggressive scanners trip a managed challenge.
resource "cloudflare_ruleset" "rate_limit" {
  zone_id = data.cloudflare_zone.this.zone_id
  name    = "alertdashboard rate limiting"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [
    {
      description = "Challenge high-volume per-IP traffic to the web host"
      action      = "managed_challenge"
      enabled     = true
      expression  = "(http.host eq \"${local.web_hostname}\" and not starts_with(http.request.uri.path, \"/_next/\") and not starts_with(http.request.uri.path, \"/rssfeed\"))"
      ratelimit = {
        characteristics     = ["ip.src", "cf.colo.id"]
        period              = 60
        requests_per_period = 120
        mitigation_timeout  = 600
      }
    },
  ]
}
