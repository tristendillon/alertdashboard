provider "cloudflare" {
  # Authentication is read from the CLOUDFLARE_API_TOKEN environment variable.
  # The token needs Zone:Read + Workers Scripts:Edit + Workers Routes:Edit on the
  # alertdashboard.com zone (see infra/README.md for exact scopes).
}
