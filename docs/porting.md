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
3. The **Convex environment variables** are written automatically by the deploy
   cascade on every run — nothing to set anywhere:
   - `CLERK_JWT_ISSUER_DOMAIN` — derived as `https://clerk.<webHostname>` from
     `deploy.config.json` (the tofu-managed Clerk frontend-API record, no trailing
     slash — Convex compares it to the JWT `iss` claim). Consumed at
     [`apps/convex/src/api/auth.config.ts:4`](../apps/convex/src/api/auth.config.ts).
   - `API_KEY` — generated fresh each cascade run and handed to the web and
     listener workers in the same run (`apps/convex/src/lib/auth.ts` also accepts
     `API_KEY_PREVIOUS` during the rotation window).

### 1.3 Clerk (fresh app)

1. Create a new Clerk application → note the **publishable key**, **secret key**,
   and **JWT issuer domain**.
2. Create a **JWT template named `convex`**. The application ID must be `convex`
   to match [`apps/convex/src/api/auth.config.ts:5`](../apps/convex/src/api/auth.config.ts)
   (`applicationID: 'convex'`).
3. Add the new web hostname to **allowed origins**.
4. For a **production Clerk instance** on the new domain: Clerk issues DNS **CNAME
   records** (Clerk dashboard → Configure → Domains). These are managed by tofu
   ([`infra/clerk.tf`](../infra/clerk.tf)) — update the `clerk_instance_slug`
   default in [`infra/variables.tf`](../infra/variables.tf) to the new instance's
   slug (the `<slug>` in the issued `dkim1.<slug>.clerk.services` targets) and
   verify the record names/targets match what Clerk issued (§5.6). Development
   instances skip this.

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
| 1 | [`apps/web/wrangler.jsonc:3`](../apps/web/wrangler.jsonc) **and** `:14` | Worker `name`, and the `WORKER_SELF_REFERENCE` service — **both must match** (currently both `alertdashboard`) | renaming workers |
| 2 | [`apps/firstdue-listener/wrangler.jsonc:3`](../apps/firstdue-listener/wrangler.jsonc) | Worker `name` (currently `firstdue-listener`) | renaming workers |
| 3 | [`apps/firstdue-listener/wrangler.jsonc:52`](../apps/firstdue-listener/wrangler.jsonc) | `CONVEX_URL` → new Convex prod URL | fresh Convex |
| 4 | [`apps/firstdue-listener/wrangler.jsonc:49-50`](../apps/firstdue-listener/wrangler.jsonc) | `WEATHER_LAT` / `WEATHER_LNG` (currently Manhattan, KS) | new location |
| 5 | [`apps/firstdue-listener/wrangler.jsonc:47`](../apps/firstdue-listener/wrangler.jsonc) + [`.env.example:16`](../apps/firstdue-listener/.env.example) + [`src/config/index.ts:32`](../apps/firstdue-listener/src/config/index.ts) default | `TIMEZONE` (currently `America/Chicago`) | new timezone |
| 6 | [`apps/firstdue-listener/src/config/index.ts:68`](../apps/firstdue-listener/src/config/index.ts) | `firstdueApiUrl` tenant subdomain | different FirstDue tenant |
| 7 | [`apps/convex/src/api/dispatches.ts:135,147,165`](../apps/convex/src/api/dispatches.ts) | Hardcoded `America/Chicago` — **known wart**, not env-driven. Must hand-edit for a different TZ. | new timezone |
| 8 | [`apps/web/src/app/layout.tsx:10-11`](../apps/web/src/app/layout.tsx) | `MFD Alerts` branding (title + description) | rebranding |
| 9 | `infra/` variables — see **note below** | `zone_name`, `web_hostname`, `listener_hostname`, `web_worker_name`, `listener_worker_name`, `clerk_instance_slug` (from the new Clerk app's issued DNS records, §1.3) | new zone / renamed workers / fresh Clerk app |
| 10 | [`infra/versions.tf:22`](../infra/versions.tf) | R2 state bucket `bucket = "sizeup-tofu-state"` → new bucket name (backend config is not variable-izable) | new account |
| 11 | Regenerate `apps/firstdue-listener/worker-configuration.d.ts` | `pnpm --filter @sizeupdashboard/firstdue-listener cf:types` (the committed file has stale generated values) | after rows 2–5 |
| 12 | Comment-only, non-functional (update for accuracy): [`apps/web/wrangler.jsonc:17`](../apps/web/wrangler.jsonc), [`apps/firstdue-listener/wrangler.jsonc:6,44`](../apps/firstdue-listener/wrangler.jsonc), [`apps/firstdue-listener/README.md:38`](../apps/firstdue-listener/README.md), [`infra/providers.tf:4`](../infra/providers.tf), [`flake.nix:2`](../flake.nix) | Update stale hostnames/zone in comments | any move |

### Row 9 — the single source of truth: `deploy.config.json`

All zone/hostname/worker-name/Clerk-slug values live in **`deploy.config.json`** at
the repo root. Tofu reads it directly (`infra/config.tf`, `jsondecode`) and the
deploy workflow reads it with `jq` — editing and committing that one file changes
both, in local applies and CI identically. The validate job
(`scripts/check-deploy-config.mjs`) fails the build if the wrangler `name` fields
drift from it.

`account_id` stays out of the repo entirely — CI derives it from the zone
(`GET /zones?name=<zoneName>` → `.result[0].account.id`); local applies export
`TF_VAR_account_id` the same way (see `infra/backend.hcl.example`).

---

## 3. Cloudflare account bootstrap

Only needed for a **new account**. Full detail (token scopes, R2 bootstrap) is in
[`../infra/README.md`](../infra/README.md); the essentials, inline:

1. **Create the custom API token** (My Profile → API Tokens → Create Token →
   Custom). Scopes:
   - Account → *Workers Scripts* → **Edit**
   - Account → *Workers R2 Storage* → **Edit** (yields the derived tofu-state creds)
   - Zone → *Zone* → **Read**
   - Zone → *DNS* → **Edit**
   - Zone → *SSL and Certificates* → **Edit**
   - Zone Resources → Include → *your new zone*

   This **one token** covers wrangler, the tofu Cloudflare provider, the derived
   R2 state credentials, and the derived account id. Stored as the single
   `CLOUDFLARE_API_TOKEN` GitHub secret.

2. **Create the R2 state bucket**:
   ```bash
   wrangler r2 bucket create <new-bucket-name>   # must match infra/versions.tf:22
   ```
   No access-key pair needed — CI derives S3 credentials from the API token.

3. **Local tofu config** (gitignored): `cd infra && cp backend.hcl.example backend.hcl`
   and follow the derivation comments inside it for credentials + `TF_VAR_account_id`.

---

## 4. GitHub configuration

Set the **5 secrets** and **2 variables** under repo Settings → Secrets and
variables → Actions. For what each one means, see [`environment.md`](./environment.md):

```bash
# Secrets (encrypted) — all externally issued, nothing generated
gh secret set CLOUDFLARE_API_TOKEN     # §3.1 (with the R2 scope!)
gh secret set CONVEX_DEPLOY_KEY        # Convex dashboard -> deploy key
gh secret set CLERK_SECRET_KEY         # Clerk dashboard -> sk_live_
gh secret set FIRSTDUE_API_KEY         # reuse unless new tenant
gh secret set WEATHER_API_KEY          # reuse

# Variables (public, build-inlined)
gh variable set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY   # referrer-restrict it!
gh variable set NEXT_PUBLIC_MAP_ID
```

Everything else — Convex URL, both app keys, the Clerk publishable key and issuer
domain, the account id, R2 state credentials — is **derived or generated by the
deploy cascade**; there is nothing to set and nothing to keep in sync (§1.2).

---

## 5. First deploy — one cascade run

The deploy cascade already encodes the ordering (convex → web + listener →
infra-apply, so Worker scripts exist before tofu attaches custom domains). After
§1–§4, a single run bootstraps everything:

```bash
gh workflow run deploy.yml -f deploy_all=true
gh run watch
```

The convex job seeds the vault (generates `API_KEY`, sets the derived
`CLERK_JWT_ISSUER_DOMAIN`); web + listener derive their values from it and deploy
(the listener image builds on the runner during `wrangler deploy`); infra applies
last. Manual equivalents, if ever needed:

```bash
pnpm --filter @sizeupdashboard/web deploy
pnpm --filter @sizeupdashboard/firstdue-listener cf:deploy
```

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

For a production Clerk instance, the five Clerk CNAME records (accounts portal,
frontend API, two DKIM keys, mail) are created by the tofu apply in §5.4 from
[`infra/clerk.tf`](../infra/clerk.tf). Confirm the applied names/targets match
what Clerk issued (§1.3) — `tofu output clerk_dns_records` — wait for Clerk to
verify them (Clerk dashboard → Configure → Domains), then confirm sign-in works
end to end on the new web hostname. The records must stay **DNS-only** (tofu sets
`proxied = false`); don't flip them to proxied in the Cloudflare dashboard.

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
2. **Workers** — delete `alertdashboard` and `firstdue-listener` (and the listener's
   Durable Object / container) on the old account.
3. **R2 state bucket** — delete `sizeup-tofu-state` (and its R2 API token) once you
   no longer need the old tofu state.
4. **Convex / Clerk** — if fresh ones were created, disable or delete the old
   Convex project and Clerk application.
5. **Secrets** — rotate or remove the old `CLOUDFLARE_*`, `R2_*`,
   `CONVEX_DEPLOY_KEY`, and Clerk keys. If the old GitHub repo/environment is
   retired, delete its secrets and variables outright.
