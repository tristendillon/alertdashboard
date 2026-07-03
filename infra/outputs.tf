output "web_hostname" {
  description = "Production custom domain for the web Worker."
  value       = cloudflare_workers_custom_domain.web.hostname
}

output "web_custom_domain_id" {
  description = "Cloudflare id of the web Worker custom domain."
  value       = cloudflare_workers_custom_domain.web.id
}

output "listener_hostname" {
  description = "Production custom domain for the listener Worker."
  value       = cloudflare_workers_custom_domain.listener.hostname
}

output "listener_custom_domain_id" {
  description = "Cloudflare id of the listener Worker custom domain."
  value       = cloudflare_workers_custom_domain.listener.id
}

output "clerk_dns_records" {
  description = "Clerk production-instance CNAME records (hostname → target)."
  value       = { for k, r in cloudflare_dns_record.clerk : k => "${r.name} -> ${r.content}" }
}

output "clerk_frontend_api_url" {
  description = "Clerk frontend-API URL; CLERK_JWT_ISSUER_DOMAIN in the Convex environment must equal this."
  value       = "https://${cloudflare_dns_record.clerk["frontend"].name}"
}
