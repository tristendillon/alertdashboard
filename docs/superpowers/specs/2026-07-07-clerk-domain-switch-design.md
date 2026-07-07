# Clerk Domain Switch Design

## Goal

Move production Clerk and application domain configuration from the current
`alertdashboard.com` setup to the Clerk-issued `mfdalertdashboard.com` setup
represented by `clerk-mfdalertdashboard.com.zone`.

## Source Of Truth

`deploy.config.json` remains the single source of truth for production domain
values consumed by OpenTofu, GitHub Actions, and validation scripts.

The new production values are:

- DNS zone: `mfdalertdashboard.com`
- Web hostname: `mfdalertdashboard.com`
- Listener hostname: `listener.mfdalertdashboard.com`
- Clerk frontend API issuer: `https://clerk.mfdalertdashboard.com`
- Clerk accounts host: `accounts.mfdalertdashboard.com`
- Clerk instance slug: `g6fa3egr21kb`

Worker script names remain unchanged.

## Architecture

No structural Terraform or workflow changes are required. Existing code already
derives downstream Clerk settings from `deploy.config.json`:

- `infra/clerk.tf` creates the five DNS-only Clerk CNAME records.
- `.github/workflows/deploy.yml` derives `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  from `clerk.<webHostname>`.
- `.github/workflows/deploy.yml` writes Convex `CLERK_JWT_ISSUER_DOMAIN` as
  `https://clerk.<webHostname>`.
- `scripts/check-deploy-config.mjs` verifies hostnames stay under the configured
  zone and Worker script names do not drift from wrangler configs.

## Documentation

Update docs that list current production values so operators see the new zone,
hosts, and Clerk slug. Keep the general configuration flow unchanged.

## Validation

Run `node scripts/check-deploy-config.mjs` after the change. This verifies the
new root web hostname is accepted under the new zone and that wrangler Worker
names still match the unchanged script names.
