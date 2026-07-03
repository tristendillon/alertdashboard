# Deployment — architecture & CI/CD

Fire-department dispatch dashboard. Everything runs on Cloudflare plus a Convex
cloud backend. Pushes to `main` deploy automatically via GitHub Actions.

Companion docs:

- [`environment.md`](./environment.md) — full env-var / secret / variable reference.
- [`porting.md`](./porting.md) — runbook for moving to a new Cloudflare account or domain.
- [`../infra/README.md`](../infra/README.md) — OpenTofu operations for the custom domains.

Concrete hostnames, Worker names, and Convex URLs below are the **current
deployment** — they can move. See [`porting.md`](./porting.md).

---

## Topology

Four independently deployed pieces:

| Piece                    | Path                     | Runs on                                             | Public host (current)         |
| ------------------------ | ------------------------ | --------------------------------------------------- | ----------------------------- |
| Web dashboard            | `apps/web`               | Cloudflare Workers (OpenNext-built Next 16 app)     | `mfd.alertdashboard.com`      |
| FirstDue listener        | `apps/firstdue-listener` | Cloudflare Container + supervisor Worker            | `listener.alertdashboard.com` |
| Convex backend           | `apps/convex`            | Convex cloud                                        | `unique-grasshopper-23.convex.cloud` |
| Custom domains (infra)   | `infra/`                 | OpenTofu → Cloudflare (state in R2)                 | —                             |

### Request & data flow

```
                          browser
                             │  HTTPS
                             ▼
              mfd.alertdashboard.com  (web Worker)
              ┌───────────────────────────────────┐
              │ OpenNext-built Next 16 app         │
              │ · placement: smart                 │
              │ · ASSETS binding (static)          │
              │ · WORKER_SELF_REFERENCE service    │
              │ · Clerk auth (middleware.ts, edge) │
              └───────────────┬───────────────────┘
                              │ convex/react-clerk
                              │ live queries (WebSocket)
                              ▼
                     ┌──────────────────┐
                     │  Convex backend  │  live queries, Clerk JWT auth,
                     │  (Convex cloud)  │  API_KEY app-auth check
                     └────────▲─────────┘
                              │ CONVEX_API_KEY-authed
                              │ mutations (push data in)
                              │
        listener.alertdashboard.com  (supervisor Worker)
        ┌────────────────────────────────────────────┐
        │ fetch()  → getContainer(LISTENER).fetch()   │  proxies HTTP + WS
        │ scheduled() cron */5 * * * * → /health probe│  restarts container
        └────────────────────┬───────────────────────┘
                             │ Durable Object (FirstdueListenerContainer)
                             ▼
              container :8080  (Node service, apps/firstdue-listener)
              ┌────────────────────────────────────────┐
              │ polls FirstDue API + OpenWeatherMap     │──▶ external APIs
              │ auth middleware (?API_KEY=…)            │
              │ /health unauthenticated                 │
              │ WS /ws/logs, in-memory ring buffer      │
              └────────────────────────────────────────┘
```

**Web Worker** (`apps/web/wrangler.jsonc`): script `sizeup-web`, entry
`.open-next/worker.js`, `compatibility_date 2026-06-01`, flags `nodejs_compat` +
`global_fetch_strictly_public`, `ASSETS` binding for static output, a
`WORKER_SELF_REFERENCE` service binding pointing back at `sizeup-web` (OpenNext
needs it), `workers_dev: false` (only the custom domain serves), and
`placement.mode: smart`. It reads live data from Convex over
`convex/react-clerk` (Clerk-authenticated live queries). `middleware.ts` runs on
the edge runtime and protects `/dashboard(.*)` via Clerk.

**Listener** (`apps/firstdue-listener`): a Node/Express service in a Cloudflare
Container, fronted by a supervisor Worker (`worker/index.ts`). The Worker's
`fetch` proxies every HTTP request and WebSocket upgrade to the single container
instance via a Durable Object (`FirstdueListenerContainer`, port 8080); its
`scheduled` handler runs on cron `*/5 * * * *` and probes `/health` so the
container auto-starts again after a Cloudflare host restart (there is no
`sleepAfter`, so it otherwise runs continuously). The container polls the
FirstDue API and OpenWeatherMap and pushes dispatches/weather/hydrants into
Convex using `CONVEX_API_KEY`-authenticated functions. Its HTTP API is guarded
by `?API_KEY=` auth middleware; `/health` is always unauthenticated; `/ws/logs`
streams logs from an in-memory ring buffer (volatile, cleared on restart). See
[`../apps/firstdue-listener/README.md`](../apps/firstdue-listener/README.md).

**Convex** (`apps/convex`): live-query backend. Clerk JWT auth is configured in
`src/api/auth.config.ts` (`applicationID: 'convex'`, issuer from the
`CLERK_JWT_ISSUER_DOMAIN` deployment env). Server-to-server callers (web Worker,
listener) authenticate with an `API_KEY` app-auth check in `src/lib/auth.ts:21`
that compares the caller-supplied key against `process.env.API_KEY`. Both env
vars are synced from GitHub by `deploy-to-convex.yml` on every deploy: `API_KEY`
from the `CONVEX_API_KEY` secret (the same one handed to web and listener) and
`CLERK_JWT_ISSUER_DOMAIN` from the GitHub variable of the same name
(`https://clerk.<web-hostname>`, the tofu-managed Clerk frontend-API record).

---

## CI/CD pipelines

Four GitHub Actions workflows, each scoped by path filter. GitHub is the single
source of truth for secrets and variables — every deploy re-syncs them onto the
target (see [`environment.md`](./environment.md)).

### `deploy-web.yml`

- **Triggers**: push to `main` on `apps/web/**`, `apps/convex/src/api/**`,
  `packages/**`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`,
  `package.json`; plus `workflow_dispatch`.
- **Concurrency**: group `deploy-web`, `cancel-in-progress: true`.
- **Job** (`deploy`): checkout → pnpm/Node 22 → `pnpm install --frozen-lockfile`.
- **Build & deploy** (`deploy-web.yml:40`): `pnpm run deploy` runs
  `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. The step env
  carries `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` (wrangler auth), the two
  runtime server secrets `CONVEX_API_KEY` + `CLERK_SECRET_KEY`, and all six
  `NEXT_PUBLIC_*` **variables** which OpenNext inlines into the client bundle at
  build time.
- **Secret sync** (`deploy-web.yml:59`): builds a `{ CONVEX_API_KEY,
  CLERK_SECRET_KEY }` JSON with `jq` and runs `wrangler secret bulk` so the
  deployed Worker's runtime secrets match GitHub, then deletes the temp file.

### `deploy-listener.yml`

- **Triggers**: push **and** pull_request to `main` on `apps/firstdue-listener/**`,
  `apps/convex/**`, `packages/**`, lockfiles, `turbo.json`, `package.json`; plus
  `workflow_dispatch`. PRs run the checks but skip the deploy.
- **Concurrency**: group `deploy-listener`, `cancel-in-progress: true`.
- **Job** (`deploy`): install → `turbo run typecheck lint --filter=…listener`
  (runs on PRs too).
- **Deploy** (`deploy-listener.yml:54`, `if: github.event_name != 'pull_request'`):
  `pnpm --filter …firstdue-listener cf:deploy` → `wrangler deploy`. wrangler
  builds the container **Docker image on the runner** from the repo-root build
  context (`image_build_context: "../.."`) during deploy.
- **Secret sync** (`deploy-listener.yml:62`, non-PR only): `jq` assembles
  `FIRSTDUE_API_KEY`, `WEATHER_API_KEY`, `CONVEX_API_KEY`, `API_KEY` into JSON,
  `wrangler secret bulk` uploads it, temp file removed. The supervisor Worker
  forwards these into the container's process env.

### `deploy-to-convex.yml`

- **Triggers**: push to `main` on `apps/convex/**`; plus `workflow_dispatch`.
- **Job** (`deploy`): install → **env sync** → `pnpm dlx convex deploy --cmd
  "pnpm lint"`. The env-sync step runs `convex env set` for `API_KEY` (from the
  `CONVEX_API_KEY` secret) and `CLERK_JWT_ISSUER_DOMAIN` (from the GitHub
  variable) before the deploy, so the deployment never runs with stale/missing
  env. `--cmd` runs lint as the codegen/pre-push step; `CONVEX_DEPLOY_KEY`
  selects the target Convex project/deployment and authenticates both steps. No
  concurrency group is declared.

### `deploy-infra.yml`

- **Triggers**: push **and** pull_request to `main` on `infra/**` or the workflow
  file itself; plus `workflow_dispatch`. `TOFU_VERSION: 1.12.3`.
- **Concurrency**: group `infra-tofu`, `cancel-in-progress: false` — runs are
  serialized so they never race on the shared R2 state.
- **Three jobs**:
  - `validate` — credential-free `tofu fmt -check` / `init -backend=false` /
    `validate`. Runs on every trigger, including fork PRs.
  - `plan` — `if: pull_request` **and** the PR head repo equals this repo (forks
    get no secrets, so they can't plan). Initializes the R2 backend and runs
    `tofu plan`. This is why `plan` shows up **skipped** on pushes to `main`:
    its `if` only matches same-repo pull requests.
  - `apply` — `if: push || workflow_dispatch`. Initializes the R2 backend,
    `tofu plan -out=tfplan`, then `tofu apply tfplan` of that exact plan.
- Both `plan` and `apply` build the backend config inline from
  `CLOUDFLARE_ACCOUNT_ID` (`endpoints.s3 = https://<account>.r2.cloudflarestorage.com`)
  and authenticate to R2 with `R2_STATE_ACCESS_KEY_ID` /
  `R2_STATE_SECRET_ACCESS_KEY`; `TF_VAR_account_id` comes from
  `CLOUDFLARE_ACCOUNT_ID`; the CF provider reads `CLOUDFLARE_API_TOKEN`.

### Secret-sync model

Neither Worker stores secrets in `wrangler.jsonc`. Instead, **GitHub secrets are
the single source of truth**: the web and listener workflows re-push them onto
the deployed Worker with `wrangler secret bulk` on every run. Rotating a value is
`gh secret set NAME` followed by re-running the deploy workflow. The full
inventory of secrets and variables lives in [`environment.md`](./environment.md).

---

## What OpenTofu manages (and what it doesn't)

`infra/` manages the two `cloudflare_workers_custom_domain` bindings
(`infra/workers.tf`) that attach `mfd.` and `listener.` to the deployed Workers —
these create the DNS records and edge certificates automatically — plus the five
Clerk production-instance CNAME records (`infra/clerk.tf`: accounts portal,
frontend API, two DKIM keys, mail; all DNS-only/unproxied). State lives in the
R2 bucket `sizeup-tofu-state` (S3-compatible backend, native lockfile locking).

Deliberately **not** in tofu: Worker scripts and container config (wrangler),
Worker secrets/vars (wrangler + GitHub Actions), the Convex backend, and the R2
bucket itself. No secret material ever lands in tofu state. Custom-domain
bindings require the Worker script to already exist, so wrangler deploys must run
before `tofu apply`. Operational details — API-token scopes, R2 bootstrap, apply
ordering, outputs — are in [`../infra/README.md`](../infra/README.md).

---

## Local development

Toolchain comes from the Nix dev shell (`flake.nix`): Node 22, pnpm, `gh`,
`wrangler`, `opentofu`, plus docker/go/postgres. Enter it with `nix develop` (or
rely on `direnv` / `.envrc`).

```bash
nix develop                 # tool shell (node, pnpm, wrangler, opentofu, gh)
CI=true pnpm install        # install workspace deps
pnpm dev                    # turbo run dev across apps
```

Turbo tasks (root `package.json` → `turbo.json`): `build`, `dev`, `lint`,
`typecheck`. Per-app dev servers:

- **web** — `pnpm --filter @sizeupdashboard/web dev` (`next dev`). Local Worker
  secrets come from `.dev.vars` (copy `apps/web/.dev.vars.example`).
- **listener** — `pnpm --filter @sizeupdashboard/firstdue-listener dev` (tsup
  watch + node). Env from `.env` (copy `.env.example`).
- **convex** — `pnpm --filter @sizeupdashboard/convex dev` (`convex dev`; the CLI
  writes `.env.local`).

Env-var setup for each app is documented in [`environment.md`](./environment.md).

### Manual deploys

CI owns deploys, but each target can be pushed by hand from the Nix shell (with
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` exported):

```bash
# web
pnpm --filter @sizeupdashboard/web deploy      # opennext build + deploy
pnpm --filter @sizeupdashboard/web preview      # local build + wrangler preview

# listener
pnpm --filter @sizeupdashboard/firstdue-listener cf:deploy    # wrangler deploy
pnpm --filter @sizeupdashboard/firstdue-listener docker:build # local image
pnpm --filter @sizeupdashboard/firstdue-listener docker:run   # run image on :8080

# convex
cd apps/convex && pnpm dlx convex deploy --cmd "pnpm lint"

# infra
cd infra && tofu init -backend-config=backend.hcl && tofu apply
```

A manual deploy does **not** run the workflow's secret-sync step; use
`wrangler secret bulk` (see [`../infra/README.md`](../infra/README.md)) if you
need to push secrets out of band.

---

## Rollback

- **Revert the commit**: `git revert <sha>` and push to `main`. The matching
  workflow redeploys the previous state (Workers, container image, Convex
  functions, or custom domains — whichever the reverted paths touch).
- **Re-run a workflow**: any of the four workflows can be re-run from a green
  historical run, or triggered fresh via `workflow_dispatch`.
- **Worker fast-rollback**: `wrangler rollback` (or `wrangler deployments list`
  then `wrangler rollback <version-id>`) in `apps/web` or
  `apps/firstdue-listener` reverts a Worker to a prior deployed version without a
  rebuild. Secrets set via `secret bulk` are not part of a version rollback —
  re-sync them if you rolled back across a secret change.
