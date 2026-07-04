# infra/ — OpenTofu for Cloudflare custom domains

This module binds the two deployed Workers to their production custom domains on the
`alertdashboard.com` zone:

| Worker              | Script name (wrangler)          | Custom domain                  |
| ------------------- | ------------------------------- | ------------------------------ |
| Web (`apps/web`)    | `alertdashboard`                    | `mfd.alertdashboard.com`       |
| Listener            | `firstdue-listener`             | `listener.alertdashboard.com`  |

**What tofu manages:** the `cloudflare_workers_custom_domain` bindings (they create
the DNS records + edge certs automatically); the five Clerk production-instance
CNAME records in `clerk.tf` (accounts portal, frontend API, two DKIM keys, mail —
all `proxied = false`; Clerk verification and DKIM break if they're ever proxied);
and the free-tier bot/scanner hardening in `security.tf` (two `cloudflare_ruleset`
resources — a custom firewall that blocks common scanner/exploit paths and
managed-challenges automated hits to `/dashboard`, plus a per-IP rate-limit rule
scoped to the web host, excluding `/_next/` and `/rssfeed`). The
instance-specific part of the DKIM/mail targets comes from the
`clerk_instance_slug` variable.

**Not in tofu (manual, one-time):** enable **Bot Fight Mode** (CF dashboard →
Security → Bots) — its Terraform resource is unreliable on the Free plan and a
failed apply would break the deploy cascade. After a worker rename, delete the
orphaned old worker script once the new one is confirmed serving.

**What tofu does NOT manage** (deliberately): Worker scripts, container config, Worker
secrets/vars, and the R2 state bucket itself. Those are handled by `wrangler` and GitHub
Actions so no secret material ever lands in tofu state.

State is stored in the Cloudflare R2 bucket `sizeup-tofu-state` via the S3-compatible
backend with native S3 conditional-write locking (`use_lockfile = true`).

---

## Prerequisites

1. **Cloudflare Workers Paid** on the account. Required for Containers (the listener) and
   it lifts the Worker size cap from 3 → 10 MiB gzip. Custom domains for Workers work on
   any plan, but the rest of this stack needs Paid.
2. `tofu` >= 1.8 installed locally.
3. The `alertdashboard.com` zone already active on this Cloudflare account.
4. Both Workers deployed at least once by wrangler (see **Apply ordering** below).

---

## API token scopes

Create a Cloudflare API token (My Profile → API Tokens → Create Token → Custom) with:

- **Account** → *Workers Scripts* → **Edit** (custom-domain attach)
- **Account** → *Workers R2 Storage* → **Edit** (derived S3 creds for the tofu state bucket)
- **Zone** → *Zone* → **Read** (also used to derive the account id from the zone)
- **Zone** → *DNS* → **Edit** (Clerk CNAMEs in clerk.tf + custom-domain records)
- **Zone** → *SSL and Certificates* → **Edit** (edge certs for the hostnames)
- Zone Resources → Include → `alertdashboard.com`

Export it for tofu:

```bash
export CLOUDFLARE_API_TOKEN=<token>
```

The same token is used by CI (stored as the `CLOUDFLARE_API_TOKEN` GitHub secret) for
`wrangler deploy`.

---

## One-time: R2 state bucket bootstrap

The tofu state backend needs an R2 bucket. Credentials are **derived from the
Cloudflare API token** — no separate R2 access-key pair, no extra GitHub secrets.

```bash
# 1. Create the bucket (uses your wrangler-authenticated CF login).
wrangler r2 bucket create sizeup-tofu-state

# 2. Derive S3-style credentials from the API token (requires the token to carry
#    the "Workers R2 Storage: Edit" account scope — see API token scopes above).
#    R2's S3 API accepts: access key = the token's id, secret = sha256(token value).
export AWS_ACCESS_KEY_ID=$(curl -sf -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify | jq -er '.result.id')
export AWS_SECRET_ACCESS_KEY=$(printf %s "$CLOUDFLARE_API_TOKEN" | sha256sum | cut -d' ' -f1)
export TF_VAR_account_id=$(curl -sf -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$(jq -er .zoneName ../deploy.config.json)" \
  | jq -er '.result[0].account.id')

# 3. Point the backend at your account's R2 endpoint (partial backend config).
cp backend.hcl.example backend.hcl
# edit backend.hcl: replace <ACCOUNT_ID> with $TF_VAR_account_id.
```

CI does the same derivation automatically (infra jobs in `.github/workflows/deploy.yml`)
— the only secret it needs is `CLOUDFLARE_API_TOKEN`.

---

## Initialize

```bash
cd infra
tofu init -backend-config=backend.hcl
```

All domain/worker-name values come from **`../deploy.config.json`** (read by tofu via
`jsondecode` in `config.tf` and by CI via `jq`) — edit that file to change them. The
only tofu variable is `account_id`, supplied via `TF_VAR_account_id` (derived from the
zone; see the bootstrap section above).

---

## Apply ordering (important)

`cloudflare_workers_custom_domain` attaches a domain to an **already-deployed** Worker
script. If the script does not exist yet, apply fails. So the order at cutover is:

1. Deploy both Workers with wrangler first (the deploy cascade orders this for you:
   its `infra-apply` job runs **after** the `web` and `listener` jobs; manually:
   ```bash
   pnpm --filter @sizeupdashboard/web deploy
   pnpm --filter @sizeupdashboard/firstdue-listener cf:deploy
   ```
   Both wrangler configs ship with `workers_dev: false`, so the Workers are unreachable
   until their custom domains attach in step 3. To smoke-test before touching DNS,
   temporarily set `workers_dev: true`, verify on the `*.workers.dev` hostnames (Clerk
   checklist, `wrangler tail`), then flip it back and redeploy.

2. **Remove any conflicting DNS records.** A Worker custom domain cannot coexist with an
   existing DNS record on the same hostname — delete any pre-existing records on the
   target hostnames in the Cloudflare dashboard (DNS tab) immediately before applying.

3. Apply the custom domains:
   ```bash
   tofu apply
   ```
   This creates the DNS records and edge certificates automatically; traffic serves only
   from the custom domains (`workers_dev` is `false`).

Applies run through **CI** (the `infra-plan` / `infra-apply` jobs of
`.github/workflows/deploy.yml`):

- **Pull requests** touching `infra/**` or `deploy.config.json`: credential-free
  `fmt`/`validate`, then a real `tofu plan` against R2 state (same-repo PRs only —
  forks get no secrets).
- **Push to `main`** (or `workflow_dispatch` with `deploy_all=true`): `tofu plan`
  then `tofu apply` of that exact plan, **after** the Worker deploy jobs. Runs are
  serialized via the workflow concurrency group on top of the state lock.

CI derives the account id and R2 credentials from `CLOUDFLARE_API_TOKEN` (see the
bootstrap section above), so local `backend.hcl` files are for humans only. Manual
applies from a laptop still work the same way and share the same state + lock.

---

## Worker secrets (never in tofu)

Secrets are pushed to the Workers via `wrangler secret bulk` by the `web` and
`listener` jobs of the deploy cascade on every run — most of them derived or
generated at deploy time (see [`../docs/environment.md`](../docs/environment.md)
for the full table). No secret material ever lands in tofu state. Manual
equivalent if ever needed: `wrangler secret put <NAME>` in the app directory.

---

## GitHub secrets / vars inventory

The full inventory — and how each value is derived — is maintained in one place:
[`../docs/environment.md`](../docs/environment.md). The infra jobs need exactly one
secret: `CLOUDFLARE_API_TOKEN` (with the scopes listed above).

---

## Outputs

```
tofu output web_hostname
tofu output listener_hostname
tofu output web_custom_domain_id
tofu output listener_custom_domain_id
tofu output clerk_dns_records        # the five Clerk CNAMEs (hostname -> target)
tofu output clerk_frontend_api_url   # = the CLERK_JWT_ISSUER_DOMAIN the cascade writes to Convex
```
