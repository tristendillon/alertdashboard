# sizeupdashboard

Real-time fire-department dispatch dashboard. A Next 16 web app renders live
dispatches, weather, and hydrants from a Convex backend; a background listener
polls the FirstDue API and OpenWeatherMap and pushes data into Convex. Everything
runs on Cloudflare.

## Packages

| Path                                                   | What it is                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| [`apps/web`](./apps/web/README.md)                     | Next 16 dashboard on Cloudflare Workers (OpenNext), Convex + Clerk.        |
| [`apps/firstdue-listener`](./apps/firstdue-listener/README.md) | Node poller in a Cloudflare Container behind a supervisor Worker. |
| [`apps/convex`](./apps/convex/README.md)               | Convex cloud backend (live queries, Clerk JWT auth).                       |
| [`infra`](./infra/README.md)                           | OpenTofu for the two Worker custom domains (state in R2).                  |

`packages/` holds shared `eslint-config` and `typescript-config`.

## Quickstart

Toolchain (Node 22, pnpm, wrangler, opentofu, gh) comes from the Nix dev shell.

```bash
nix develop            # enter the tool shell
CI=true pnpm install   # install workspace deps
pnpm dev               # turbo run dev across the apps
```

Other root turbo tasks: `pnpm build`, `pnpm lint`, `pnpm typecheck`. Per-app dev
servers and env setup are in each app's README and [`docs/environment.md`](./docs/environment.md).

## Deployment

Pushes to `main` deploy automatically via GitHub Actions — web and listener to
Cloudflare, functions to Convex, custom domains via OpenTofu. GitHub secrets and
variables are the single source of truth and are re-synced onto each target on
every deploy. See [`docs/deployment.md`](./docs/deployment.md) for the
architecture and pipelines, [`docs/environment.md`](./docs/environment.md) for
the env/secret reference, [`docs/porting.md`](./docs/porting.md) to move to a new
account or domain, and [`infra/README.md`](./infra/README.md) for OpenTofu ops.
