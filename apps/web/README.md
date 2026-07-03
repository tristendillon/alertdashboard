# @sizeupdashboard/web

Fire-department dispatch dashboard. Next 16 App Router with Convex live queries
and Clerk auth, styled with Tailwind 4, deployed to Cloudflare Workers via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

Live data comes from the Convex backend (`@sizeupdashboard/convex`) over
`convex/react-clerk`; server code reaches Convex with `CONVEX_API_KEY`.

## Scripts

| Script       | Command                                                    | Purpose                                   |
| ------------ | --------------------------------------------------------- | ----------------------------------------- |
| `dev`        | `next dev`                                                 | Local dev server.                         |
| `build`      | `next build`                                               | Next production build.                    |
| `preview`    | `opennextjs-cloudflare build && … preview`                | Build + run the Worker locally.           |
| `deploy`     | `opennextjs-cloudflare build && … deploy`                 | Build + deploy the Worker to Cloudflare.  |
| `typecheck`  | `tsc --noEmit`                                             | Type check.                               |
| `lint`       | `eslint .`                                                 | Lint.                                     |
| `cf-typegen` | `wrangler types --env-interface CloudflareEnv …`          | Regenerate Worker env types.              |

Run via pnpm, e.g. `pnpm --filter @sizeupdashboard/web dev`. CI deploys on push
to `main` (`.github/workflows/deploy-web.yml`); see
[`../../docs/deployment.md`](../../docs/deployment.md).

## Environment

`NEXT_PUBLIC_*` variables are inlined into the client bundle at build time;
`CONVEX_API_KEY` and `CLERK_SECRET_KEY` are runtime Worker secrets. The full
reference is in [`../../docs/environment.md`](../../docs/environment.md). For
local `next dev`/`next build`, copy `.env.example` → `.env` (gitignored) and fill
it in; for `preview`/`wrangler dev` Worker runtime secrets, copy
`.dev.vars.example` → `.dev.vars` (gitignored).

## Notes

- `src/middleware.ts` is Clerk middleware and stays on the **edge runtime** — the
  OpenNext Cloudflare adapter does not support the newer Next `proxy.ts`, so
  auth routing lives in `middleware.ts`.
- `images.unoptimized: true` (`next.config.ts`) — no Next image optimizer on
  Workers.
- Cloudflare config is in `wrangler.jsonc` (script `sizeup-web`, `ASSETS`
  binding, `WORKER_SELF_REFERENCE`, smart placement, custom domain only).
