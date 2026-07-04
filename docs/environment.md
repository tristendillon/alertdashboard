# Environment & Configuration Reference

Single source of truth for **every** configuration value in this monorepo: what each
variable is, where its value comes from, and how to set it. This is a fire-department
dispatch dashboard with four deploy targets:

| Target | Where it runs | Config surface |
|---|---|---|
| `apps/web` | Cloudflare Workers (Next.js via OpenNext) | derived build vars + Worker secrets, all resolved by `deploy.yml` |
| `apps/firstdue-listener` | Cloudflare Containers (supervisor Worker + Docker container) | Worker secrets (derived/generated in CI) → container env; non-secret `vars` in `wrangler.jsonc` |
| `apps/convex` | Convex cloud | Convex deployment environment — **the vault** for generated keys |
| `infra/` | GitHub Actions → OpenTofu → Cloudflare | credentials derived from the CF token |

Related docs (do not duplicate — cross-linked below):
- **[`docs/deployment.md`](./deployment.md)** — architecture, the deploy cascade, workflow triggers.
- **[`docs/porting.md`](./porting.md)** — runbook for a new Cloudflare account / new domain.

> **Never commit or print a real secret value.** `.env`, `.env.local`, `.dev.vars`, and
> `backend.hcl` are gitignored. This document names variables and describes where their
> values originate — it contains no key material.

---

## 1. The model: 5 root secrets, 2 public variables, everything else derived

A single workflow (`.github/workflows/deploy.yml`) runs the deploy cascade
**convex → web + listener → infra**. GitHub holds only credentials that an external
party issued; every other value is **derived, generated, or read from the repo** at
deploy time:

- **`deploy.config.json`** (repo root) — zone, hostnames, worker names, Clerk instance
  slug. Read by tofu (`infra/config.tf`, `jsondecode`) and by workflows (`jq`).
  Consistency with the wrangler configs is enforced by `scripts/check-deploy-config.mjs`
  in the validate job. Porting a domain = editing this file.
- **The Convex deployment env is the vault.** Generated keys are stored there and read
  back with the deploy key (`npx convex env get <NAME>`), because GitHub blocks
  secret-valued job outputs. Nothing generated is ever stored in GitHub.
- **Rotation is automatic.** Every run of the `convex` job generates a fresh shared app
  key (`API_KEY`), keeping the previous one valid as `API_KEY_PREVIOUS`
  (`apps/convex/src/lib/auth.ts` accepts both), and forces web + listener redeploys so
  they pick up the new key — zero-downtime, zero-touch rotation. The listener's endpoint
  key is likewise regenerated on every listener deploy.

### 1a. GitHub Actions **secrets** (5 — all externally issued)

| Secret | Issued by | Consumed by | Breaks if missing |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → API Tokens. Scopes: Workers Scripts Edit, **Workers R2 Storage Edit**, Zone Read, DNS Edit, SSL Edit (see `infra/README.md`). | every job that touches Cloudflare; also yields the derived R2 state creds and account id | all wrangler/tofu operations fail auth |
| `CONVEX_DEPLOY_KEY` | Convex dashboard → deployment settings → Deploy key | `convex` job (deploy + vault writes); `web`/`listener` jobs (vault reads) | convex deploy and all derivations fail |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys → Secret keys (`sk_live_`) | `web` job (build env + Worker secret) | server-side Clerk auth fails |
| `FIRSTDUE_API_KEY` | FirstDue tenant admin | `listener` job (Worker secret) | listener can't pull dispatches (zod → exit 1) |
| `WEATHER_API_KEY` | OpenWeatherMap | `listener` job (Worker secret) | listener weather fetch fails (zod → exit 1) |

### 1b. GitHub Actions **variables** (2 — public, externally issued)

| Variable | Source | Notes |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud console → Maps credentials | Inlined into the client bundle; **must be HTTP-referrer-restricted** since it's public anyway. |
| `NEXT_PUBLIC_MAP_ID` | Google Cloud console → Map Management | Inlined into the client bundle. |

### 1c. Derived / generated values (nothing to manage)

| Value | How it's produced (all in `deploy.yml`) |
|---|---|
| Cloudflare account id | `GET /zones?name=<zoneName>` → `.result[0].account.id` (token's Zone Read scope) |
| R2 state credentials (tofu backend) | access key = the token's id (`GET /user/tokens/verify`), secret = `sha256(token value)` — [documented R2 S3-API derivation](https://developers.cloudflare.com/r2/api/tokens/) |
| `NEXT_PUBLIC_CONVEX_URL` / listener `CONVEX_URL` | `npx convex function-spec \| jq -er .url` (deploy key) |
| `CONVEX_API_KEY` (web + listener) / Convex `API_KEY` | generated `openssl rand -hex 32` in the vault, read back via `npx convex env list` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_` + base64(`clerk.<webHostname>` + `$`), `=` padding stripped — Clerk's documented key format |
| `CLERK_JWT_ISSUER_DOMAIN` (Convex env) | `https://clerk.<webHostname>` from `deploy.config.json` |
| Listener endpoint `API_KEY` | generated fresh every listener deploy; stored in the vault as `LISTENER_API_KEY` |

**Retrieving generated keys** (needs `CONVEX_DEPLOY_KEY` in the env):

```bash
cd apps/convex
npx convex env get LISTENER_API_KEY   # the listener's ?API_KEY= endpoint key
npx convex env get API_KEY            # the shared app key (rarely needed by humans)
```

---

## 2. How configuration flows

- **Worker secrets** (web + listener): each deploy job assembles a JSON blob (from root
  secrets + derived/generated values) and pushes it with `wrangler secret bulk`, which
  re-rolls the deployed Worker version. There is no manual `wrangler secret put` in the
  steady state.
- **Build-time client vars** (`NEXT_PUBLIC_*`): exported into the job env before
  `pnpm run deploy` and **inlined into the client JS bundle at build time**. They are
  **public** — never put a real secret behind a `NEXT_PUBLIC_` name.
- **Listener config chain**: job env → Worker secret (`wrangler secret bulk`) →
  container process env. The supervisor Worker forwards both `wrangler.jsonc` `vars` and
  Worker secrets into the container via `envVars` in
  `apps/firstdue-listener/worker/index.ts`. The listener validates them on boot.
- **Convex**: its deployment env is written by the `convex` job (`convex env set`) on
  every run — dashboard edits get overwritten. It doubles as the vault (§1c).

**Rotating things:**
- Generated keys (`API_KEY`, `LISTENER_API_KEY`): automatic on every cascade run. To
  force one: `gh workflow run deploy.yml -f deploy_all=true`. To revoke the previous
  shared key immediately after a rotation: `npx convex env remove API_KEY_PREVIOUS`.
- Root secrets: `gh secret set NAME` then re-run the cascade (`deploy_all=true`).
  Rotating `CLOUDFLARE_API_TOKEN` implicitly rotates the derived R2 state credentials.

---

## 3. Per-app reference

### 3a. `apps/web` (Cloudflare Workers via OpenNext)

Validation schema: `apps/web/src/env.ts` (t3-env + zod).

| Variable | Kind | Required? | Where the value comes from in CI |
|---|---|---|---|
| `NODE_ENV` | server | required enum | build/runtime |
| `CONVEX_API_KEY` | server (Worker secret) | required | vault read (`convex-derive` action) |
| `CLERK_SECRET_KEY` | server (Worker secret) | required | GitHub secret |
| `NEXT_PUBLIC_CONVEX_URL` | client (build-inlined) | required | derived from the Convex deployment |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | client | required | GitHub variable |
| `NEXT_PUBLIC_MAP_ID` | client | required | GitHub variable |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | required | derived from `webHostname` |
| `NEXT_PUBLIC_LOG_VERBOSE` | client | optional, default `"false"` | not set in CI |

Timezone note: there is no timezone config anymore. Timestamps are stored as UTC epoch
ms; the UI buckets/formats in the **viewer's** browser timezone
(`utils/timestamp.ts`).

**Escape hatch:** `SKIP_ENV_VALIDATION=1` skips t3-env validation.
`emptyStringAsUndefined: true` means empty string = missing for required vars.

**Non-secret Worker config** lives in `apps/web/wrangler.jsonc` (name `alertdashboard`,
`nodejs_compat`, `workers_dev: false`, no `vars` block).

### 3b. `apps/firstdue-listener` (Cloudflare Containers)

Validation schema: `apps/firstdue-listener/src/config/index.ts` (zod; fail-fast
`exit(1)` on boot). `dotenv` loads `.env.local`/`.env` only when
`NODE_ENV !== 'production'`.

| Variable | Kind | Required? / Default | Source in prod |
|---|---|---|---|
| `NODE_ENV`, `PORT` | runtime | defaults | hardcoded by the Worker (`worker/index.ts`) |
| `TIMEZONE` | non-secret | default `America/Chicago` | `wrangler.jsonc` `vars` — **log formatting only**, never affects stored data |
| `LOG_LEVEL` | non-secret | `debug` (dev) / `info` (prod) | `wrangler.jsonc` `vars` |
| `WEATHER_LAT` / `WEATHER_LNG` | non-secret | required | `wrangler.jsonc` `vars` |
| `WEATHER_UNITS` | code default | `imperial` — pinned; the web UI hardcodes `mph` | not set anywhere |
| `FIRSTDUE_API_KEY` | **secret** | required | GitHub secret → Worker secret |
| `WEATHER_API_KEY` | **secret** | required | GitHub secret → Worker secret |
| `CONVEX_URL` | **secret** (derived) | required (`z.url()`) | derived from the Convex deployment → Worker secret |
| `CONVEX_API_KEY` | **secret** (generated) | required | vault read → Worker secret |
| `API_KEY` | **secret** (generated) | optional — unset ⇒ endpoints unauthenticated | generated per deploy → Worker secret; retrievable as vault `LISTENER_API_KEY` |

Not env-driven (hardcoded): `firstdueApiUrl: 'https://sizeup.firstduesizeup.com/fd-api/v1'`
— the `sizeup` subdomain is tenant-specific.

Because `wrangler types` can't see injected secrets, `worker/index.ts` augments the
generated `Env` interface with them (including `CONVEX_URL`).

### 3c. `apps/convex` (Convex cloud — the vault)

Written by the `convex` job on every run; dashboard edits are overwritten.

| Variable | Written by | Consumed at | Notes |
|---|---|---|---|
| `API_KEY` | generated fresh each run | `apps/convex/src/lib/auth.ts` | shared app key; callers pass it as `apiKey` |
| `API_KEY_PREVIOUS` | previous `API_KEY` on rotation | `auth.ts` | grace key so running workers survive the rotation window |
| `LISTENER_API_KEY` | `listener` job | (nothing — retrieval only) | current listener endpoint key for humans/tools |
| `CLERK_JWT_ISSUER_DOMAIN` | derived `https://clerk.<webHostname>` | `apps/convex/src/api/auth.config.ts` | must match the Clerk JWT `iss` (no trailing slash) |

`CONVEX_DEPLOY_KEY` (GitHub secret) selects the project/deployment and authenticates
all of the above. `CONVEX_DEPLOYMENT` in `apps/convex/.env.local` is dev-only.

### 3d. `infra/` (OpenTofu → Cloudflare)

Runs inside `deploy.yml`: `infra-plan` (same-repo PRs touching infra paths) and
`infra-apply` (push/dispatch, **after** web + listener so custom domains can attach on
a fresh account). Concurrency is serialized by the workflow-level group.

The only secret used is `CLOUDFLARE_API_TOKEN`; the account id and R2 state
credentials are derived (§1c). The backend (`versions.tf`) hardcodes bucket
`sizeup-tofu-state`; the endpoint is generated at init. The only tofu variable is
`account_id` (`TF_VAR_account_id`, derived in CI); all other values come from
`deploy.config.json` via `infra/config.tf`. Tofu manages the two
`cloudflare_workers_custom_domain` bindings and the five Clerk CNAMEs
(`infra/clerk.tf`) — not Worker scripts, secrets, or the R2 bucket.

---

## 4. Cross-app identities (read carefully)

- **Vault `API_KEY` === web/listener `CONVEX_API_KEY`** — one shared app-level key,
  equal **by construction**: the cascade generates it in the vault and every consumer
  reads it back in the same run. The dual-key grace (`API_KEY_PREVIOUS`) covers the
  minutes between rotation and the workers' redeploy.
- **The listener's `API_KEY` is a DIFFERENT key.** It gates the listener's own HTTP/WS
  endpoints. It has no programmatic consumer — only humans/tools use it — and it
  changes on every listener deploy (fetch it via vault `LISTENER_API_KEY`).
- **`NEXT_PUBLIC_CONVEX_URL` (web) and `CONVEX_URL` (listener)** both derive from the
  same `CONVEX_DEPLOY_KEY`, so they cannot point at different deployments.

---

## 5. Local development

Template files (copy to the gitignored real file, fill in values — **never commit them**):

| App | Template | Real file (gitignored) | Notes |
|---|---|---|---|
| listener | `apps/firstdue-listener/.env.example` | `.env` (or `.env.local`) | dotenv loads it only when `NODE_ENV !== production`. |
| web (`next dev`/`next build`) | `apps/web/.env.example` | `.env` | server secrets + `NEXT_PUBLIC_*` values (dev instances). |
| web (`preview`/`wrangler dev`) | `apps/web/.dev.vars.example` | `.dev.vars` | only the two Worker secrets. |
| convex | (generated) | `apps/convex/.env.local` | `convex dev` writes `CONVEX_DEPLOYMENT`; set the dev deployment's `CLERK_JWT_ISSUER_DOMAIN`/`API_KEY` in the dev Convex dashboard. |

Values that differ in dev vs prod:
- **Convex deployment**: dev `useful-sardine-117` vs prod `unique-grasshopper-23`;
  local work points `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` at dev.
- **Clerk**: use the **development** instance keys (`pk_test_`/`sk_test_`) locally; the
  prod publishable key is derived in CI, the prod secret key lives in GitHub.
- **`CONVEX_API_KEY` / dev Convex `API_KEY`**: pick any dev-only shared value; it must
  match between your local web/listener config and the dev Convex deployment env.

Local tofu applies: see `infra/backend.hcl.example` for deriving the R2 credentials
and `TF_VAR_account_id` from your own Cloudflare token.

`.env`, `.env.local`, `.dev.vars`, and `infra/backend.hcl` are all gitignored and must
never be committed.

---

## 6. Current deployment (July 2026)

Concrete environment-specific values currently in use. **[`docs/porting.md`](./porting.md)**
covers changing all of these for a new account/domain.

| Thing | Value | Defined at |
|---|---|---|
| DNS zone | `alertdashboard.com` | `deploy.config.json` |
| Web hostname | `mfd.alertdashboard.com` | `deploy.config.json` |
| Listener hostname | `listener.alertdashboard.com` | `deploy.config.json` |
| Web Worker name | `alertdashboard` | `deploy.config.json` + `apps/web/wrangler.jsonc` (checked for drift in CI) |
| Listener Worker name | `firstdue-listener` | `deploy.config.json` + `apps/firstdue-listener/wrangler.jsonc` |
| Clerk instance slug | `083ah0f8xra3` | `deploy.config.json` (DKIM/mail CNAME targets) |
| Prod Convex deployment | `unique-grasshopper-23` | encoded in `CONVEX_DEPLOY_KEY`; URL derived at deploy time |
| Weather location | Manhattan, KS | `apps/firstdue-listener/wrangler.jsonc` `vars` |
