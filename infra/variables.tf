variable "account_id" {
  type        = string
  description = "Cloudflare account id that owns the zone and workers."
}

variable "zone_name" {
  type        = string
  description = "DNS zone the custom domains live on (already on Cloudflare)."
  default     = "alertdashboard.com"
}

variable "web_worker_name" {
  type        = string
  description = "Name of the deployed web Worker (from apps/web/wrangler.jsonc)."
  default     = "sizeup-web"
}

variable "listener_worker_name" {
  type        = string
  description = "Name of the deployed listener Worker (from apps/firstdue-listener/wrangler.jsonc)."
  default     = "firstdue-listener"
}

variable "web_hostname" {
  type        = string
  description = "Custom domain hostname for the web Worker."
  default     = "mfd.alertdashboard.com"
}

variable "listener_hostname" {
  type        = string
  description = "Custom domain hostname for the listener Worker."
  default     = "listener.alertdashboard.com"
}
