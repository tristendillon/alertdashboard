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
| Web dashboard            | `apps/web`               | Cloudflare Workers (OpenNext-built Next 16 app)     | `mfdalertdashboard.com`      |
| FirstDue listener        | `apps/firstdue-listener` | Cloudflare Container + supervisor Worker            | `listener.mfdalertdashboard.com` |
| Convex backend           | `apps/convex`            | Convex cloud                                        | `unique-grasshopper-23.convex.cloud` |
| Custom domains (infra)   | `infra/`                 | OpenTofu → Cloudflare (state in R2)                 | —                             |

### Request & data flow

```
                          browser
                             │  HTTPS
                             ▼
              mfdalertdashboard.com  (web Worker)
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
        listener.mfdalertdashboard.com  (supervisor Worker)
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

**Web Worker** (`apps/web/wrangler.jsonc`): script `alertdashboard`, entry
`.open-next/worker.js`, `compatibility_date 2026-06-01`, flags `nodejs_compat` +
`global_fetch_strictly_public`, `ASSETS` binding for static output, a
`WORKER_SELF_REFERENCE` service binding pointing back at `alertdashboard` (OpenNext
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
that compares the caller-supplied key against `process.env.API_KEY` (or
`API_KEY_PREVIOUS` during a rotation window). Both env vars are written by the
`convex` job of the deploy cascade on every run: `API_KEY` is generated fresh
(and handed to web + listener in the same cascade) and `CLERK_JWT_ISSUER_DOMAIN`
is derived as `https://clerk.<webHostname>` from `deploy.config.json` (the
tofu-managed Clerk frontend-API record).

---

## CI/CD: the deploy cascade

One workflow — `.github/workflows/deploy.yml` — runs everything as a job graph:

```
changes ─ validate ─┬─ infra-plan            (PRs only, same-repo, infra paths)
                    └─ convex ─┬─ web        (push/dispatch only)
                               └─ listener
                                    └──────── infra-apply   (last)
```

- **`changes`** — `dorny/paths-filter` decides which deploy jobs a push needs
  (`deploy.config.json` and the workflow itself count as "everything"). A manual
  `workflow_dispatch` with `deploy_all=true` runs every job.
- **`validate`** — credential-free, runs on every PR including forks:
  `check-deploy-config.mjs` (wrangler.jsonc ↔ `deploy.config.json` drift), turbo
  typecheck + lint for all apps, `tofu fmt`/`validate`.
- **`convex`** — the vault. On every run it **rotates the shared app key**
  (`API_KEY` ← fresh `openssl rand -hex 32`, previous value kept as
  `API_KEY_PREVIOUS` for a zero-downtime overlap), sets the derived
  `CLERK_JWT_ISSUER_DOMAIN`, then `convex deploy --cmd "pnpm lint"`. Its `rotated`
  output forces web + listener to run whenever it ran.
- **`web`** — reads `CONVEX_API_KEY` back from the vault and derives
  `NEXT_PUBLIC_CONVEX_URL` (both via the `convex-derive` composite action), derives
  the Clerk publishable key from `webHostname` and the account id from the zone,
  builds + deploys via OpenNext, then `wrangler secret bulk`s
  `CONVEX_API_KEY` + `CLERK_SECRET_KEY` onto the Worker.
- **`listener`** — same derivations, plus it **generates a fresh endpoint key**
  every deploy (stored in the vault as `LISTENER_API_KEY` for retrieval), builds
  the container image on the runner during `cf:deploy`, then bulk-syncs
  `FIRSTDUE_API_KEY`, `WEATHER_API_KEY`, `CONVEX_API_KEY`, `CONVEX_URL`, `API_KEY`.
- **`infra-plan` / `infra-apply`** — OpenTofu against the R2 state backend with
  credentials **derived from `CLOUDFLARE_API_TOKEN`** (account id from the zone;
  R2 S3 creds = token id + sha256 of the token). Apply runs **last** because
  Worker custom domains require the Worker scripts to exist — a fresh account
  bootstraps in a single cascade run.
- **Concurrency**: one `deploy-main` group with `cancel-in-progress: false` (tofu
  state writes and key rotation must never be cancelled); PR runs get per-PR
  groups that do cancel.

### Secret model

GitHub holds only the **5 root secrets** (`CLOUDFLARE_API_TOKEN`,
`CONVEX_DEPLOY_KEY`, `CLERK_SECRET_KEY`, `FIRSTDUE_API_KEY`, `WEATHER_API_KEY`)
and 2 public Google Maps variables. Everything else is derived or generated at
deploy time and, if it needs to persist, lives in the Convex deployment env (the
vault) — see [`environment.md`](./environment.md) for the full derivation table
and retrieval commands. Neither Worker stores secrets in `wrangler.jsonc`; each
deploy re-pushes them with `wrangler secret bulk`. Rotating a root secret is
`gh secret set NAME` + `gh workflow run deploy.yml -f deploy_all=true`; generated
keys rotate themselves on every cascade run.

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
