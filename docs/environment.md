# Environment & Configuration Reference

Single source of truth for **every** configuration value in this monorepo: what each
variable is, where its value comes from, and how to set it. This is a fire-department
dispatch dashboard with four deploy targets:

| Target | Where it runs | Config surface |
|---|---|---|
| `apps/web` | Cloudflare Workers (Next.js via OpenNext) | GitHub secrets + vars → Worker secrets + inlined build vars |
| `apps/firstdue-listener` | Cloudflare Containers (supervisor Worker + Docker container) | GitHub secrets → Worker secrets → container env; non-secret `vars` in `wrangler.jsonc` |
| `apps/convex` | Convex cloud | Convex dashboard environment (its own store) + a deploy key |
| `infra/` | GitHub Actions → OpenTofu → Cloudflare | GitHub secrets → tofu/AWS/CF env |

Related docs (do not duplicate — cross-linked below):
- **[`docs/deployment.md`](./deployment.md)** — architecture, CI/CD pipeline, workflow triggers.
- **[`docs/porting.md`](./porting.md)** — runbook for a new Cloudflare account / new domain.

> **Never commit or print a real secret value.** `.env`, `.env.local`, `.dev.vars`, and
> `backend.hcl` are gitignored. This document names variables and describes where their
> values originate — it contains no key material.

---

## 1. How configuration flows

**GitHub Actions secrets and variables are the single source of truth for all deployed
values.** There is no manual `wrangler secret put` in the steady state — the deploy
workflows re-sync everything on every run:

- **Worker secrets** (web + listener): each deploy workflow builds a JSON blob from
  GitHub secrets with `jq` and pushes it with `wrangler secret bulk`, which re-rolls the
  deployed Worker version with the new values. This means **rotating a secret =
  `gh secret set NAME <value>` then re-run the deploy workflow** (or just wait for the
  next push to the relevant paths). Setting the GitHub secret alone does nothing until a
  deploy runs.
- **Build-time client vars** (`NEXT_PUBLIC_*`): passed as `env:` into `pnpm run deploy`
  and **inlined into the client JS bundle at build time**. Changing one requires a
  rebuild/redeploy of `apps/web`; they are baked into shipped assets, not read at runtime.
  (They are also therefore **public** — visible in the browser bundle. Never put a real
  secret behind a `NEXT_PUBLIC_` name.)
- **Listener config chain**: GitHub secret → Worker secret (`wrangler secret bulk`) →
  container process env. The supervisor Worker forwards both `wrangler.jsonc` `vars` and
  Worker secrets into the container via `envVars` in
  `apps/firstdue-listener/worker/index.ts:25`. The listener validates them on boot.
- **Convex** has an entirely separate environment store (the Convex **dashboard**, per
  deployment). Its two runtime env vars (`CLERK_JWT_ISSUER_DOMAIN`, `API_KEY`) are **not**
  in GitHub and **not** in the repo — they are set in the Convex dashboard. The only
  GitHub-side Convex value is `CONVEX_DEPLOY_KEY`, used to push code.

---

## 2. Master tables

### 2a. GitHub Actions **secrets** (10)

Configure at **repo → Settings → Secrets and variables → Actions → Secrets**.

| Secret | Consumed by (workflow) | Where the value comes from | Breaks if missing |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `deploy-web`, `deploy-listener`, `deploy-infra` | Cloudflare dashboard → **My Profile → API Tokens → Create Token** (custom). Scopes: **Account → Workers Scripts → Edit**, **Zone → Zone → Read**, **Zone → DNS → Edit**, **Zone → SSL and Certificates → Edit**, scoped to the target zone. | All `wrangler deploy`/`secret bulk` and all `tofu` runs fail auth. |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy-web`, `deploy-listener`, `deploy-infra` | Cloudflare dashboard sidebar (Account ID), or `wrangler whoami`. In infra it also becomes `TF_VAR_account_id` **and** builds the R2 endpoint `https://<id>.r2.cloudflarestorage.com`. | Deploys target the wrong/no account; infra init can't reach R2 state. |
| `R2_STATE_ACCESS_KEY_ID` | `deploy-infra` (→ `AWS_ACCESS_KEY_ID`) | Cloudflare **R2 → Manage R2 API Tokens** → token with **Object Read & Write** scoped to the `sizeup-tofu-state` bucket (Access Key ID half). | OpenTofu can't read/write remote state; plan/apply fail. |
| `R2_STATE_SECRET_ACCESS_KEY` | `deploy-infra` (→ `AWS_SECRET_ACCESS_KEY`) | Same R2 API token (Secret Access Key half; shown once at creation). | Same as above. |
| `CONVEX_API_KEY` | `deploy-web`, `deploy-listener` | **You generate it yourself** (shared secret, e.g. `openssl rand -hex 32`). **Must equal the `API_KEY` env var set in the Convex dashboard** — it is an app-level auth key checked by `apps/convex/src/lib/auth.ts:24`, **not** a Convex platform key. | Web/listener calls to Convex mutations/queries are rejected as `Unauthorized`. |
| `CLERK_SECRET_KEY` | `deploy-web` | Clerk dashboard → **API Keys → Secret keys**. | Server-side Clerk auth in the web Worker fails. |
| `FIRSTDUE_API_KEY` | `deploy-listener` | FirstDue / SizeUp tenant API key (from the FirstDue tenant admin). | Listener can't pull dispatches; fails zod validation → `exit(1)`. |
| `WEATHER_API_KEY` | `deploy-listener` | OpenWeatherMap account → API keys. | Listener weather fetch fails; fails zod validation → `exit(1)`. |
| `API_KEY` | `deploy-listener` | **You generate it yourself** (e.g. `openssl rand -hex 32`). Gates the **listener's own** HTTP/WebSocket endpoints. **If unset, the listener endpoints are UNAUTHENTICATED** (runs open, logs a warning per request). | Nothing breaks functionally — the listener just runs with no endpoint auth. |
| `CONVEX_DEPLOY_KEY` | `deploy-to-convex` | Convex dashboard → **deployment settings → Deploy key**. This is the actual **Convex platform** key. | `convex deploy` can't push functions/schema. |

### 2b. GitHub Actions **variables** (6)

Configure at **repo → Settings → Secrets and variables → Actions → Variables**. All are
`NEXT_PUBLIC_*` build-time vars consumed only by `deploy-web` and **inlined into the
client bundle** (public).

| Variable | Consumed by | Where the value comes from | Breaks if missing |
|---|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `deploy-web` | The **production** Convex deployment URL (Convex dashboard → deployment → URL, e.g. `https://unique-grasshopper-23.convex.cloud`). Must point at the **same** prod deployment as the listener's `CONVEX_URL`. | Build fails env validation (`env.ts:20`); client can't reach Convex. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `deploy-web` | Google Cloud Console → **APIs & Services → Credentials** (Maps JavaScript API key). | Build fails validation; map won't load. |
| `NEXT_PUBLIC_MAP_ID` | `deploy-web` | Google Cloud Console → **Google Maps Platform → Map Management** (Map ID). | Build fails validation; styled/vector map won't render. |
| `NEXT_PUBLIC_DB_TIMEZONE` | `deploy-web` | IANA tz string for interpreting stored timestamps (e.g. `America/Chicago`). Falls back to `"UTC"` at `apps/web/src/utils/timestamp.ts:70` if the value is empty at runtime, but the build **requires** the var to be present. | Build fails validation. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `deploy-web` | Clerk dashboard → **API Keys → Publishable keys**. Embeds the Clerk instance domain — implicitly ties the build to one Clerk instance. | Build fails validation; client-side Clerk won't initialize. |
| `NEXT_PUBLIC_LOG_VERBOSE` | `deploy-web` | Optional. `"true"`/`"false"`. **Default `"false"`** (`env.ts:25`). | Nothing — defaults to `false`. |

---

## 3. Per-app configuration

### 3a. `apps/web` (Cloudflare Workers / OpenNext)

Validation schema: `apps/web/src/env.ts` (t3-env, `@t3-oss/env-nextjs` + zod).

| Variable | Kind | Consumed at | Required? | Notes |
|---|---|---|---|---|
| `NODE_ENV` | server | `env.ts:10`, `:35` | required, enum `development\|test\|production` | Set by the build/runtime. |
| `CONVEX_API_KEY` | server (Worker secret) | `env.ts:11`, `:34` | required (`z.string()`) | Synced via `wrangler secret bulk` (`deploy-web.yml:64-69`). App-level key (§4). |
| `CLERK_SECRET_KEY` | server (Worker secret) | `env.ts:12`, `:35` | required (`z.string()`) | Validated by the schema and also read directly by `@clerk/nextjs` from the Worker env. Synced as a Worker secret alongside `CONVEX_API_KEY`. |
| `NEXT_PUBLIC_CONVEX_URL` | client (build-inlined) | `env.ts:20`, `providers/index.tsx:9` | required | See §2b. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | client | `env.ts:21` | required | |
| `NEXT_PUBLIC_MAP_ID` | client | `env.ts:22` | required | |
| `NEXT_PUBLIC_DB_TIMEZONE` | client | `env.ts:23` | required | Runtime fallback `"UTC"` (`utils/timestamp.ts:70`). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | `env.ts:24` | required | |
| `NEXT_PUBLIC_LOG_VERBOSE` | client | `env.ts:25` | optional, **default `"false"`** | |

**Escape hatch:** set `SKIP_ENV_VALIDATION=1` to skip all t3-env validation
(`env.ts:50`) — useful for Docker/CI builds where the full env isn't present.
`emptyStringAsUndefined: true` (`env.ts:55`) means an empty-string value for a required
var is treated as missing and throws.

**Non-secret Worker config** lives in `apps/web/wrangler.jsonc`: name `sizeup-web`, main
`.open-next/worker.js`, `compatibility_date "2026-06-01"`, flags `nodejs_compat` +
`global_fetch_strictly_public`, `ASSETS` binding, `WORKER_SELF_REFERENCE` service →
`sizeup-web`, `workers_dev: false`, `placement.mode: smart`. There is **no `vars`
block** — all runtime values are injected as Worker secrets in CI.

### 3b. `apps/firstdue-listener` (Cloudflare Containers)

Validation schema: `apps/firstdue-listener/src/config/index.ts:27-44` (zod). Loading:
`dotenv` reads `.env.local` then `.env` **only when `NODE_ENV !== 'production'`**
(`index.ts:9-13`); in production the container env is injected directly. On any parse
failure the process **prints the issues and `process.exit(1)`** (`index.ts:48-55`) —
fail-fast on boot.

| Variable | Kind | Required? / Default | Source in prod |
|---|---|---|---|
| `NODE_ENV` | runtime | default `development` | Hardcoded `'production'` by the Worker (`worker/index.ts:26`). |
| `PORT` | runtime | coerce int, default `8080` | Hardcoded `'8080'` by the Worker (`worker/index.ts:27`); container `EXPOSE 8080`. |
| `TIMEZONE` | non-secret | default `America/Chicago` | `wrangler.jsonc:47` `vars` → forwarded. |
| `LOG_LEVEL` | non-secret | optional enum; falls back to `debug` (dev) / `info` (prod) at `index.ts:59-60` | `wrangler.jsonc:48` (`info`). |
| `FIRSTDUE_API_KEY` | **secret** | required (`min(1)`) | GitHub secret → Worker secret → container. |
| `WEATHER_API_KEY` | **secret** | required (`min(1)`) | GitHub secret → Worker secret → container. |
| `WEATHER_LAT` | non-secret | required (`min(1)`) | `wrangler.jsonc:49` (`39.19296187328465`). |
| `WEATHER_LNG` | non-secret | required (`min(1)`) | `wrangler.jsonc:50` (`-96.58551325178348`). |
| `WEATHER_UNITS` | non-secret | default `imperial` | `wrangler.jsonc:51`. |
| `CONVEX_URL` | non-secret | required (`z.url()`) | `wrangler.jsonc:52` — the **production** Convex URL. |
| `CONVEX_API_KEY` | **secret** | required (`min(1)`) | GitHub secret → Worker secret → container. App-level key (§4). |
| `API_KEY` | **secret** | **optional** — unset ⇒ endpoints run **unauthenticated** | GitHub secret → Worker secret → container (only forwarded if set). |

Not env-driven (hardcoded): `firstdueApiUrl: 'https://sizeup.firstduesizeup.com/fd-api/v1'`
(`index.ts:68`) — the `sizeup` subdomain is tenant-specific.

**`vars` (non-secret, committed) vs Worker secrets (synced) split.** The
`wrangler.jsonc` `vars` block (`:46-53`) holds only non-secret config and is committed to
the repo. Secrets (`FIRSTDUE_API_KEY`, `WEATHER_API_KEY`, `CONVEX_API_KEY`, `API_KEY`) are
**never** in `wrangler.jsonc` — they are set via `wrangler secret bulk` from GitHub secrets
by `deploy-listener.yml:62-82`. Because `wrangler types` can't see the injected secrets,
`worker/index.ts:6-12` augments the generated `Env` interface with them.

**Worker → container forwarding chain.** `FirstdueListenerContainer.envVars`
(`worker/index.ts:25-38`) assembles the container's process env: hardcoded `NODE_ENV` and
`PORT`, pass-through of the `vars` (`TIMEZONE`, `LOG_LEVEL`, `WEATHER_LAT`, `WEATHER_LNG`,
`WEATHER_UNITS`, `CONVEX_URL`), the three required secrets, and `API_KEY` **only if
present** (`...(this.env.API_KEY ? { API_KEY } : {})`).

### 3c. `apps/convex` (Convex cloud)

Convex has its **own** environment store, set per-deployment in the **Convex dashboard**
(Settings → Environment Variables) — these are **not** GitHub secrets and **not** in the repo.

| Variable | Kind | Consumed at | Notes |
|---|---|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | Convex dashboard env | `apps/convex/src/api/auth.config.ts:4` | Clerk provider `domain`; `applicationID: 'convex'`. Must match the Clerk instance / JWT template `convex`. |
| `API_KEY` | Convex dashboard env | `apps/convex/src/lib/auth.ts:21-24` | App-level auth key. **Must equal GitHub secret `CONVEX_API_KEY`.** `auth.ts:22` **throws** if it is unset. Callers passing a matching `apiKey` get `authStatus: 'apiKey'`. |
| `CONVEX_DEPLOY_KEY` | GitHub secret (CI only) | `deploy-to-convex.yml:37` | Platform deploy key; selects which Convex project/deployment gets `convex deploy --cmd "pnpm lint"`. |
| `CONVEX_DEPLOYMENT` | local `.env.local` (dev only) | `convex dev` | Selects the dev deployment locally; written by `convex dev`. Not used in CI. |

`convex.json` sets `{ functions: "src/api/" }`; `convex.config.ts` registers the
`@convex-dev/geospatial` and `@convex-dev/aggregate` components. (The root README's
`convex deploy --cmd "pnpm build"` snippet is stale — the workflow uses `--cmd "pnpm lint"`.)

### 3d. `infra/` CI (OpenTofu → Cloudflare)

Workflow `deploy-infra.yml` maps GitHub secrets to tofu/AWS env. Jobs: `validate`
(credential-free, all PRs incl. forks), `plan` (same-repo PRs), `apply` (push / dispatch).
`TOFU_VERSION: '1.12.3'`; concurrency group `infra-tofu`, `cancel-in-progress: false`
(serializes state access).

| Env in CI | Source | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub secret | CF provider auth (`providers.tf` reads it from env). |
| `AWS_ACCESS_KEY_ID` | `R2_STATE_ACCESS_KEY_ID` | R2 (S3-compatible) state backend auth. |
| `AWS_SECRET_ACCESS_KEY` | `R2_STATE_SECRET_ACCESS_KEY` | Same. |
| `TF_VAR_account_id` | `CLOUDFLARE_ACCOUNT_ID` | Fills required tofu var `account_id`. |
| R2 endpoint | built from `CLOUDFLARE_ACCOUNT_ID` at init: `https://<id>.r2.cloudflarestorage.com` (`deploy-infra.yml:68,95`) | S3 backend endpoint (`versions.tf:32` expects it from `backend.hcl`). |

**tofu variables** (`infra/variables.tf`): `account_id` (required, no default); `zone_name`
(default `alertdashboard.com`); `web_worker_name` (default `sizeup-web`);
`listener_worker_name` (default `firstdue-listener`); `web_hostname` (default
`mfd.alertdashboard.com`); `listener_hostname` (default `listener.alertdashboard.com`).
Override via `terraform.tfvars` (copy from `terraform.tfvars.example`). The `s3` backend
(`versions.tf:21-34`) hardcodes bucket `sizeup-tofu-state`, key `infra/terraform.tfstate`,
`region auto`, `use_lockfile=true`; the endpoint is supplied at init. tofu manages **only**
the two `cloudflare_workers_custom_domain` resources — not Worker scripts, container config,
secrets, or the R2 bucket. See **[`docs/deployment.md`](./deployment.md)** for the full
infra flow.

---

## 4. Cross-app identities (read carefully)

Several distinctly-named variables must hold **identical** values, and one similarly-named
pair must **not** be confused:

- **`CONVEX_API_KEY` (GitHub secret) === `API_KEY` (Convex dashboard env).** This is one
  shared app-level auth secret. Web (`env.ts:11`) and the listener (`config/index.ts:40`)
  send it as `apiKey`; Convex checks it at `apps/convex/src/lib/auth.ts:24`. If the two
  values drift, every authenticated web/listener → Convex call fails as `Unauthorized`.
- **The listener's `API_KEY` is a DIFFERENT key.** It protects the **listener's own**
  HTTP/WebSocket endpoints (`config/index.ts:43`, forwarded at `worker/index.ts:37`). It is
  unrelated to Convex's `API_KEY`. Unset ⇒ listener endpoints are unauthenticated.
  - Beware the naming collision: GitHub secret `API_KEY` → the **listener** endpoint key;
    Convex dashboard `API_KEY` → the **shared** key that equals GitHub `CONVEX_API_KEY`.
- **`NEXT_PUBLIC_CONVEX_URL` (web GitHub var) and `CONVEX_URL` (listener
  `wrangler.jsonc:52`) must point at the same production Convex deployment**
  (`https://unique-grasshopper-23.convex.cloud`). Otherwise web and the listener write to /
  read from different databases.

---

## 5. Local development

Template files (copy to the gitignored real file, fill in values — **never commit them**):

| App | Template | Real file (gitignored) | Notes |
|---|---|---|---|
| listener | `apps/firstdue-listener/.env.example` | `.env` (or `.env.local`) | Full annotated template; dotenv loads it only when `NODE_ENV !== production`. |
| web (`next dev`/`next build`) | `apps/web/.env.example` | `.env` | Full annotated template: both server secrets (`CONVEX_API_KEY`, `CLERK_SECRET_KEY`) and all `NEXT_PUBLIC_*` values. |
| web (`preview`/`wrangler dev`) | `apps/web/.dev.vars.example` | `.dev.vars` | Only the two Worker secrets (`CONVEX_API_KEY`, `CLERK_SECRET_KEY`); `NEXT_PUBLIC_*` are build-inlined from `.env`/CI, not here. |
| convex | (generated) | `apps/convex/.env.local` | `convex dev` writes `CONVEX_DEPLOYMENT`; the dev deployment's `CLERK_JWT_ISSUER_DOMAIN` / `API_KEY` are set in the **dev** Convex dashboard, not the file. |

Values that differ in dev vs prod:
- **Convex deployment**: dev `useful-sardine-117` vs prod `unique-grasshopper-23`. Local
  work points `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` at the dev deployment.
- **Clerk**: use the Clerk **development** instance keys (publishable + secret) locally;
  the prod instance keys go in GitHub.
- **`CONVEX_API_KEY` / Convex `API_KEY`**: use a dev-only shared value for the dev
  deployment; it still must match between your local web/listener config and the dev
  Convex dashboard.

`.env`, `.env.local`, `.dev.vars`, and `infra/backend.hcl` / `infra/terraform.tfvars` are
all gitignored and must never be committed.

---

## 6. Current deployment (July 2026)

Concrete environment-specific values currently in use. **[`docs/porting.md`](./porting.md)**
covers changing all of these for a new account/domain.

| Thing | Value | Defined at |
|---|---|---|
| DNS zone | `alertdashboard.com` | `infra/variables.tf:9`, `infra/providers.tf` |
| Web hostname | `mfd.alertdashboard.com` | `infra/variables.tf:27` |
| Listener hostname | `listener.alertdashboard.com` | `infra/variables.tf:33` |
| Web Worker name | `sizeup-web` | `apps/web/wrangler.jsonc:3,14`; `infra/variables.tf:15` |
| Listener Worker name | `firstdue-listener` | `apps/firstdue-listener/wrangler.jsonc:3`; `infra/variables.tf:21` |
| Convex prod deployment | `unique-grasshopper-23` (`https://unique-grasshopper-23.convex.cloud`) | `apps/firstdue-listener/wrangler.jsonc:52`; web GitHub var `NEXT_PUBLIC_CONVEX_URL` |
| Convex dev deployment | `useful-sardine-117` | `apps/firstdue-listener/wrangler.jsonc:44` (comment) |
| R2 state bucket | `sizeup-tofu-state` | `infra/versions.tf:22` |
| Weather lat/lng | `39.19296187328465` / `-96.58551325178348` (Manhattan, KS) | `apps/firstdue-listener/wrangler.jsonc:49-50` |
| Timezone (listener/prod) | `America/Chicago` | `apps/firstdue-listener/wrangler.jsonc:47` |
| FirstDue API base | `https://sizeup.firstduesizeup.com/fd-api/v1` | `apps/firstdue-listener/src/config/index.ts:68` |
