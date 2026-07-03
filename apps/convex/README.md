# @sizeupdashboard/convex

Convex cloud backend for the dispatch dashboard: live queries for dispatches,
weather, and hydrants, plus the mutations the listener calls to push data in.

Functions live in **`src/api/`** (set via `convex.json`'s `"functions": "src/api/"`),
not the default `convex/` directory. Installed Convex components
(`src/api/convex.config.ts`):

- [`@convex-dev/geospatial`](https://www.npmjs.com/package/@convex-dev/geospatial) — hydrant / location queries.
- [`@convex-dev/aggregate`](https://www.npmjs.com/package/@convex-dev/aggregate) — rollups.

## Auth

Two layers:

- **Clerk JWT** for end users — configured in `src/api/auth.config.ts`
  (`applicationID: 'convex'`, issuer from the `CLERK_JWT_ISSUER_DOMAIN`
  **Convex dashboard** env var).
- **App API key** for server-to-server callers (web Worker, listener) — the check
  in `src/lib/auth.ts` compares the caller-supplied `apiKey` against
  `process.env.API_KEY` (a Convex-environment value that must equal the
  `CONVEX_API_KEY` used by web and listener).

## Local development

```bash
pnpm dev     # convex dev — watches src/api/ and pushes to your dev deployment
```

The Convex CLI creates `.env.local` (deployment URL, etc.) on first run. Set the
dashboard env vars `CLERK_JWT_ISSUER_DOMAIN` and `API_KEY` for your dev
deployment. Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm logs`.

## Deployment

CI deploys on push to `main` via the `convex` job of `.github/workflows/deploy.yml`
(`convex deploy --cmd "pnpm lint"`, authenticated with `CONVEX_DEPLOY_KEY`). See
[`../../docs/deployment.md`](../../docs/deployment.md) and
[`../../docs/environment.md`](../../docs/environment.md).
