# Porting runbook — moving the stack to a new Cloudflare account and/or domain

This stack currently runs on the owner's personal Cloudflare account, on the
`alertdashboard.com` zone, against the Convex prod deployment
`unique-grasshopper-23`. This runbook takes it start-to-finish onto a **different
Cloudflare account and/or a different domain/zone**.

It is self-contained for **ordering**. For the meaning of each secret/variable and
where its value comes from, see [`environment.md`](./environment.md). For how the
CI/CD pipelines and architecture work, see [`deployment.md`](./deployment.md). For
the OpenTofu-specific details (token scopes, R2 bootstrap commands), see
[`../infra/README.md`](../infra/README.md). This runbook links to those rather than
duplicating them, but inlines the short commands you need in sequence.

> Never commit or print real secret values. The currently-live Convex slugs and
> hostnames are referenced below only as "current values" for orientation.

---

## 0. Decision points (read first)

Two axes change independently. Decide both before you start, then use the matrix to
see which steps apply.

| Question | Options |
| --- | --- |
| **Cloudflare account** | Same account / **new account** |
| **Domain / zone** | Same zone / **new zone** |
| **Convex** | Reuse existing project / **fresh project** |
| **Clerk** | Reuse existing app / **fresh app** |
| **FirstDue tenant** | Same tenant (`sizeup`) / **different tenant** |

New Cloudflare account almost always implies fresh Convex + fresh Clerk (you are
building an independent environment). Reusing Convex/Clerk across accounts is
possible but couples the two environments — only do it deliberately.

### Which steps apply

| Step | Account only | Domain only | Both (typical full move) |
| --- | --- | --- | --- |
| §1 Third-party prerequisites | CF account + zone | zone only | all |
| §2 Repo edits | worker names, R2 bucket, listener vars | zone/hostnames (§2 row 9) | all rows |
| §3 CF account bootstrap (token, R2 state) | yes | no | yes |
| §4 GitHub config | rotate CF/R2/Convex/Clerk secrets | update hostnames vars | all |
| §5 First deploy | yes | re-attach domains | yes |
| §6 Verification | yes | yes | yes |
| §7 Decommission old | old account | old DNS records | both |

> "Account only" (same domain, new CF account): you still move the zone to the new
> account (a zone lives on exactly one account), so in practice an account move is
> almost always also a zone move. Treat "account only" as "both" unless you are
> certain the zone stays put.

---

## 1. Third-party prerequisites

These can be done in any order, before touching the repo. Collect the outputs — you
will paste them into §2 (repo) and §4 (GitHub).

### 1.1 Cloudflare

- An account on the **Workers Paid** plan. This is a **hard requirement**: the
  listener runs as a Cloudflare Container, which is Paid-only. (Paid also lifts the
  Worker size cap 3 → 10 MiB gzip.) See [`../infra/README.md`](../infra/README.md)
  Prerequisites.
- The **target zone added and active** on that account (a zone belongs to exactly
  one account). Note the account id (`wrangler whoami` or the dashboard sidebar).

### 1.2 Convex (fresh project)

1. Create a new Convex project → note the **prod deployment URL**
   (`https://<slug>.convex.cloud`; current value `https://unique-grasshopper-23.convex.cloud`).
2. Generate a **Deploy key** for that prod deployment → this becomes the
   `CONVEX_DEPLOY_KEY` GitHub secret (§4).
3. Set the two **Convex dashboard environment variables** (Convex reads these from
   its own environment, not the repo):
   - `CLERK_JWT_ISSUER_DOMAIN` — the Clerk issuer domain from §1.3. Consumed at
     [`apps/convex/src/api/auth.config.ts:4`](../apps/convex/src/api/auth.config.ts).
   - `API_KEY` — the shared app-auth secret. Convex compares caller-supplied keys
     against this (`apps/convex/src/lib/auth.ts`). It **must equal** the
     `CONVEX_API_KEY` the web and listener workers send. Generate fresh:
     `openssl rand -hex 32`.

### 1.3 Clerk (fresh app)

1. Create a new Clerk application → note the **publishable key**, **secret key**,
   and **JWT issuer domain**.
2. Create a **JWT template named `convex`**. The application ID must be `convex`
   to match [`apps/convex/src/api/auth.config.ts:5`](../apps/convex/src/api/auth.config.ts)
   (`applicationID: 'convex'`).
3. Add the new web hostname to **allowed origins**.
4. For a **production Clerk instance** on the new domain: Clerk issues DNS **CNAME
   records** (Clerk dashboard → Configure → Domains). Add them to the new zone
   (§5.6). Development instances skip this.

### 1.4 FirstDue

The API base URL is **tenant-specific** and hardcoded:
`https://sizeup.firstduesizeup.com/fd-api/v1` at
[`apps/firstdue-listener/src/config/index.ts:68`](../apps/firstdue-listener/src/config/index.ts).
The `sizeup` subdomain is the tenant. If you are moving to a **different FirstDue
tenant**, edit that subdomain (§2 row 6) and obtain that tenant's API key.
Otherwise reuse the existing `FIRSTDUE_API_KEY`.

### 1.5 Google Maps

An API key **and** a Map ID from the Google Cloud console (or reuse the existing
ones). These become `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_MAP_ID` (§4).

### 1.6 OpenWeatherMap

An API key (or reuse the existing one) → `WEATHER_API_KEY` (§4).

---

## 2. Repo edits checklist

Every file that carries an account-, domain-, or location-specific value. Rows 1–8
and 10 are code/config edits; row 9 (infra variables) is the important nuance —
read its note carefully. Make these on a branch and merge to `main` (CI deploys from
`main`).

| # | File:line | Change | Applies when |
| --- | --- | --- | --- |
| 1 | [`apps/web/wrangler.jsonc:3`](../apps/web/wrangler.jsonc) **and** `:14` | Worker `name`, and the `WORKER_SELF_REFERENCE` service — **both must match** (currently both `sizeup-web`) | renaming workers |
| 2 | [`apps/firstdue-listener/wrangler.jsonc:3`](../apps/firstdue-listener/wrangler.jsonc) | Worker `name` (currently `firstdue-listener`) | renaming workers |
| 3 | [`apps/firstdue-listener/wrangler.jsonc:52`](../apps/firstdue-listener/wrangler.jsonc) | `CONVEX_URL` → new Convex prod URL | fresh Convex |
| 4 | [`apps/firstdue-listener/wrangler.jsonc:49-50`](../apps/firstdue-listener/wrangler.jsonc) | `WEATHER_LAT` / `WEATHER_LNG` (currently Manhattan, KS) | new location |
| 5 | [`apps/firstdue-listener/wrangler.jsonc:47`](../apps/firstdue-listener/wrangler.jsonc) + [`.env.example:16`](../apps/firstdue-listener/.env.example) + [`src/config/index.ts:32`](../apps/firstdue-listener/src/config/index.ts) default | `TIMEZONE` (currently `America/Chicago`) | new timezone |
| 6 | [`apps/firstdue-listener/src/config/index.ts:68`](../apps/firstdue-listener/src/config/index.ts) | `firstdueApiUrl` tenant subdomain | different FirstDue tenant |
| 7 | [`apps/convex/src/api/dispatches.ts:135,147,165`](../apps/convex/src/api/dispatches.ts) | Hardcoded `America/Chicago` — **known wart**, not env-driven. Must hand-edit for a different TZ. | new timezone |
| 8 | [`apps/web/src/app/layout.tsx:10-11`](../apps/web/src/app/layout.tsx) | `MFD Alerts` branding (title + description) | rebranding |
| 9 | `infra/` variables — see **note below** | `zone_name`, `web_hostname`, `listener_hostname`, `web_worker_name`, `listener_worker_name` | new zone / renamed workers |
| 10 | [`infra/versions.tf:22`](../infra/versions.tf) | R2 state bucket `bucket = "sizeup-tofu-state"` → new bucket name (backend config is not variable-izable) | new account |
| 11 | Regenerate `apps/firstdue-listener/worker-configuration.d.ts` | `pnpm --filter @sizeupdashboard/firstdue-listener cf:types` (the committed file has stale generated values) | after rows 2–5 |
| 12 | Comment-only, non-functional (update for accuracy): [`apps/web/wrangler.jsonc:17`](../apps/web/wrangler.jsonc), [`apps/firstdue-listener/wrangler.jsonc:6,44`](../apps/firstdue-listener/wrangler.jsonc), [`apps/firstdue-listener/README.md:38`](../apps/firstdue-listener/README.md), [`infra/providers.tf:4`](../infra/providers.tf), [`flake.nix:2`](../flake.nix) | Update stale hostnames/zone in comments | any move |

### Row 9 — the infra variables nuance (CI does NOT read `terraform.tfvars`)

`infra/variables.tf` defines `zone_name`, `web_hostname`, `listener_hostname`,
`web_worker_name`, and `listener_worker_name`, all with defaults pointing at the
current environment. There are two ways to override them, and **they behave
differently for local vs CI**:

- **Local `tofu apply`** reads `infra/terraform.tfvars` (copied from
  `terraform.tfvars.example`). Overrides there work for laptop applies only.
- **CI (`deploy-infra.yml`)** does **NOT** pass any `-var-file`. Verified: the
  workflow sets only `TF_VAR_account_id` from the `CLOUDFLARE_ACCOUNT_ID` secret
  ([`.github/workflows/deploy-infra.yml:57,84`](../.github/workflows/deploy-infra.yml))
  and runs a bare `tofu plan`/`tofu apply`
  ([`:73,100,103`](../.github/workflows/deploy-infra.yml)). Your `terraform.tfvars`
  is gitignored and never reaches the runner. So in CI, every variable **except
  `account_id`** resolves to its **default in `variables.tf`**.

**Conclusion / what actually works with CI:** for a new zone, hostnames, or worker
names to take effect in the CI-driven apply, you **must edit the defaults in
[`infra/variables.tf`](../infra/variables.tf)** (lines 9, 15, 21, 27, 33) and commit
them. Setting them only in `terraform.tfvars` will make local applies correct while
CI silently applies the old values. (Alternatively, add matching `TF_VAR_zone_name`
etc. env entries to the `plan` and `apply` jobs of `deploy-infra.yml` — but editing
`variables.tf` defaults is the smaller, less error-prone change and is the
recommended approach.) `account_id` stays out of the repo — it flows from the
secret via `TF_VAR_account_id` in both local (tfvars) and CI paths.

---

## 3. Cloudflare account bootstrap

Only needed for a **new account**. Full detail (token scopes, R2 bootstrap) is in
[`../infra/README.md`](../infra/README.md); the essentials, inline:

1. **Create the custom API token** (My Profile → API Tokens → Create Token →
   Custom). Scopes:
   - Account → *Workers Scripts* → **Edit**
   - Zone → *Zone* → **Read**
   - Zone → *DNS* → **Edit**
   - Zone → *SSL and Certificates* → **Edit**
   - Zone Resources → Include → *your new zone*

   This one token is used by both `wrangler` (workers) and the tofu Cloudflare
   provider, and is stored as the `CLOUDFLARE_API_TOKEN` GitHub secret.

2. **Create the R2 state bucket** and an S3 access-key pair:
   ```bash
   wrangler r2 bucket create <new-bucket-name>   # must match infra/versions.tf:22
   ```
   Then in the dashboard: R2 → Manage R2 API Tokens → Create API Token → Object
   Read & Write, scoped to that bucket. Copy the **Access Key ID** and **Secret** —
   these become `R2_STATE_ACCESS_KEY_ID` / `R2_STATE_SECRET_ACCESS_KEY` (§4).

3. **Local tofu config** from the examples (both gitignored):
   ```bash
   cd infra
   cp backend.hcl.example backend.hcl          # set https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   cp terraform.tfvars.example terraform.tfvars # set account_id (+ local overrides per §2 row 9)
   ```
   Remember: `terraform.tfvars` overrides are for **local** applies only (§2 row 9).

---

## 4. GitHub configuration

Set all **10 secrets** and **6 variables** under repo Settings → Secrets and
variables → Actions. For what each one means and its exact consumer, see the tables
in [`environment.md`](./environment.md); the command pattern is:

```bash
# Secrets (encrypted)
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
# ... etc

# Variables (plaintext, inlined into the client bundle at build)
gh variable set NEXT_PUBLIC_CONVEX_URL
gh variable set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# ... etc
```

Which values change on a move:

| Category | Names | Source on a new environment |
| --- | --- | --- |
| **NEW per environment** | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_STATE_ACCESS_KEY_ID`, `R2_STATE_SECRET_ACCESS_KEY`, `CONVEX_DEPLOY_KEY`, `CLERK_SECRET_KEY` (secrets); `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (vars) | §1/§3 outputs |
| **Freshly generated** | `CONVEX_API_KEY` **and** `API_KEY` — **must be identical to each other and to the Convex-dashboard `API_KEY`** (§1.2) | `openssl rand -hex 32` |
| **Likely carried over** | `FIRSTDUE_API_KEY`, `WEATHER_API_KEY` (unless new tenant/provider) | reuse |
| **Location/branding vars** | `NEXT_PUBLIC_DB_TIMEZONE`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_MAP_ID`, `NEXT_PUBLIC_LOG_VERBOSE` | reuse or update to new location/keys |

> The web `CONVEX_API_KEY` secret, the listener `CONVEX_API_KEY` secret, the
> listener `API_KEY` secret, and the Convex-dashboard `API_KEY` env var are the
> **same shared app-auth secret** in four places. If any drifts, authenticated
> calls between listener/web and Convex fail with 401.

---

## 5. First deploy — ordering matters

Verified against the deploy workflows and [`../infra/README.md`](../infra/README.md)
"Apply ordering". Do these in order.

### 5.1 Deploy Convex first

The schema and functions must exist before any client connects. Trigger
`deploy-to-convex.yml` (push to `main` touching `apps/convex/**`, or
`workflow_dispatch`). It runs `convex deploy` against the deployment selected by
`CONVEX_DEPLOY_KEY`.

### 5.2 Deploy the web + listener Workers

The **Worker scripts must exist before tofu can attach custom domains** (a custom
domain attaches to an already-deployed script). Trigger `deploy-web.yml` and
`deploy-listener.yml` (push to `main`, or `workflow_dispatch`), or run manually:

```bash
pnpm --filter @sizeupdashboard/web deploy
pnpm --filter @sizeupdashboard/firstdue-listener cf:deploy
```

The listener image builds on the runner during `wrangler deploy` (Docker, repo root
as build context).

### 5.3 Clear conflicting DNS on the target hostnames

A Worker custom domain **cannot coexist** with an existing DNS record on the same
hostname. In the new zone's DNS tab, delete any pre-existing record on the target
web and listener hostnames before applying tofu. On the current zone this was a
legacy `mfd` record; on a fresh zone there is usually nothing to remove.

### 5.4 Attach custom domains with tofu

Run the Infra workflow (push to `main` touching `infra/**`, or `workflow_dispatch`),
or locally:

```bash
cd infra
tofu init -backend-config=backend.hcl
tofu apply
```

This creates the `cloudflare_workers_custom_domain` bindings, which auto-create the
DNS records and edge certificates. **Reminder (§2 row 9):** the CI apply uses
`variables.tf` **defaults** for hostnames/zone/worker-names — make sure you edited
those defaults, not just `terraform.tfvars`, before relying on the workflow.

### 5.5 (Optional) workers.dev smoke test

Both wrangler configs ship with `workers_dev: false`
([`apps/web/wrangler.jsonc:18`](../apps/web/wrangler.jsonc),
[`apps/firstdue-listener/wrangler.jsonc:7`](../apps/firstdue-listener/wrangler.jsonc)),
so the Workers are **unreachable until the custom domains attach**. To smoke-test a
Worker before DNS is live, temporarily flip `workers_dev: true`, redeploy, hit the
`*.workers.dev` URL, then flip it back to `false` and redeploy so traffic only
serves from the custom domain.

### 5.6 Clerk DNS + sign-in

For a production Clerk instance, add the CNAME records Clerk issued (§1.3) to the
new zone, wait for Clerk to verify them, then confirm sign-in works end to end on
the new web hostname.

---

## 6. Verification checklist

| Check | Command / action | Expect |
| --- | --- | --- |
| Listener health | `curl https://<listener-host>/health` | `200` |
| Listener auth | `curl https://<listener-host>/<protected>` (no key, when `API_KEY` set) | `401` |
| Web loads | open `https://<web-host>` | page renders |
| Sign-in | complete Clerk sign-in on the web host | authenticated session |
| End-to-end data | wait for a dispatch (or the `*/5` cron) | dispatch flows listener → Convex → web live query and appears in the UI |
| CI green | `gh run list` | all recent deploy runs green |
| Infra state | `cd infra && tofu output` | `web_hostname` / `listener_hostname` = new hostnames, custom-domain ids present |

---

## 7. Decommissioning the old environment

Once the new environment is verified and traffic is cut over, tear down the old one
to stop billing and avoid split-brain:

1. **Custom domains** — `tofu destroy` against the old state (or delete the two
   custom domains in the old dashboard). This frees the old hostnames' DNS records.
2. **Workers** — delete `sizeup-web` and `firstdue-listener` (and the listener's
   Durable Object / container) on the old account.
3. **R2 state bucket** — delete `sizeup-tofu-state` (and its R2 API token) once you
   no longer need the old tofu state.
4. **Convex / Clerk** — if fresh ones were created, disable or delete the old
   Convex project and Clerk application.
5. **Secrets** — rotate or remove the old `CLOUDFLARE_*`, `R2_*`,
   `CONVEX_DEPLOY_KEY`, and Clerk keys. If the old GitHub repo/environment is
   retired, delete its secrets and variables outright.
