## GIT REPO LINE COUNTS

git ls-files | grep -vE '\.md$|\.mdc$|package(-lock)?\.json$|pnpm-lock\.yaml$' | xargs wc -l

## DEPLOYMENT

Everything runs on Cloudflare. Pushes to `main` deploy automatically via GitHub Actions;
the manual runbook (custom domains, secrets, one-time bootstrap) lives in
[`infra/README.md`](./infra/README.md).

- **Listener** (`apps/firstdue-listener`) → Cloudflare Container behind a supervisor
  Worker. Deployed by `pnpm --filter @sizeupdashboard/firstdue-listener cf:deploy`
  (CI: `.github/workflows/deploy-listener.yml`, which also syncs Worker secrets).
- **Web** (`apps/web`) → Cloudflare Workers via `@opennextjs/cloudflare`. Deployed by
  `pnpm --filter @sizeupdashboard/web deploy`
  (CI: `.github/workflows/deploy-web.yml`).
- **Convex** (`apps/convex`) → deployed by the existing
  `.github/workflows/deploy-to-convex.yml` (unchanged).
- **Custom domains** for both Workers are managed with OpenTofu in
  [`infra/`](./infra/README.md).

## CONVEX DEPLOY COMMAND

cd apps/convex
pnpm dlx convex deploy --cmd "pnpm build"
