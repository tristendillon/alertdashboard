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
