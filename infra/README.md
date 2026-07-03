# infra/ — OpenTofu for Cloudflare custom domains

This module binds the two deployed Workers to their production custom domains on the
`alertdashboard.com` zone:

| Worker              | Script name (wrangler)          | Custom domain                  |
| ------------------- | ------------------------------- | ------------------------------ |
| Web (`apps/web`)    | `sizeup-web`                    | `mfd.alertdashboard.com`       |
| Listener            | `firstdue-listener`             | `listener.alertdashboard.com`  |

**What tofu manages:** the `cloudflare_workers_custom_domain` bindings (they create
the DNS records + edge certs automatically) and the five Clerk production-instance
CNAME records in `clerk.tf` (accounts portal, frontend API, two DKIM keys, mail —
all `proxied = false`; Clerk verification and DKIM break if they're ever proxied).
The instance-specific part of the DKIM/mail targets comes from the
`clerk_instance_slug` variable.

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
- **Zone** → *Zone* → **Read**
- **Zone** → *DNS* → **Edit** (custom domains create DNS records)
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

The tofu state backend needs an R2 bucket and an S3 access-key pair.

```bash
# 1. Create the bucket (uses your wrangler-authenticated CF login).
wrangler r2 bucket create sizeup-tofu-state

# 2. Create an R2 API token / access key pair in the Cloudflare dashboard:
#    R2 → Manage R2 API Tokens → Create API Token → Object Read & Write,
#    scoped to the sizeup-tofu-state bucket. Copy the Access Key ID + Secret.
#    These are the S3-style credentials the backend authenticates with.
#    Store the same pair as the GitHub secrets R2_STATE_ACCESS_KEY_ID /
#    R2_STATE_SECRET_ACCESS_KEY so deploy-infra.yml can plan/apply in CI.
export AWS_ACCESS_KEY_ID=<r2 access key id>
export AWS_SECRET_ACCESS_KEY=<r2 secret access key>

# 3. Point the backend at your account's R2 endpoint (partial backend config).
cp backend.hcl.example backend.hcl
# edit backend.hcl: replace <ACCOUNT_ID> with your Cloudflare account id.
```

The account id is on the Cloudflare dashboard sidebar (or `wrangler whoami`).

---

## Initialize

```bash
cd infra
tofu init -backend-config=backend.hcl
```

Then provide `account_id` (and any overrides) via a tfvars file:

```bash
cp terraform.tfvars.example terraform.tfvars   # fill in account_id
```

---

## Apply ordering (important)

`cloudflare_workers_custom_domain` attaches a domain to an **already-deployed** Worker
script. If the script does not exist yet, apply fails. So the order at cutover is:

1. Deploy both Workers with wrangler first (this happens automatically on `main` via the
   `deploy-web` / `deploy-listener` GitHub Actions, or run them manually):
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

Applies run through **CI** (`deploy-infra.yml`):

- **Pull requests** touching `infra/**`: credential-free `fmt`/`validate`, then a real
  `tofu plan` against R2 state (same-repo PRs only — forks get no secrets).
- **Push to `main`** touching `infra/**` (or manual `workflow_dispatch`): `tofu plan`
  then `tofu apply` of that exact plan. Runs are serialized via a concurrency group on
  top of the state lock.

CI builds the backend config from `CLOUDFLARE_ACCOUNT_ID` and authenticates to R2 with
the `R2_STATE_ACCESS_KEY_ID` / `R2_STATE_SECRET_ACCESS_KEY` secrets (see
[`../docs/environment.md`](../docs/environment.md)), so local `backend.hcl` files
are for humans only. Manual applies from a laptop
still work the same way and share the same state + lock.

---

## Worker secrets (set once, out of band — never in tofu)

Secrets are pushed to the Workers via `wrangler secret`, not tofu. Both deploy
workflows bulk-sync them from GitHub secrets on every deploy, so GitHub is the single
source of truth — rotating a value is `gh secret set NAME` + rerun the deploy workflow.
Which secret/var goes where is documented in [`../docs/environment.md`](../docs/environment.md);
the manual `wrangler` equivalents are below.

**Web** (`apps/web`): `deploy-web.yml` syncs `CONVEX_API_KEY` + `CLERK_SECRET_KEY`
after each deploy. Manual equivalent if ever needed:

```bash
cd apps/web
wrangler secret put CONVEX_API_KEY
wrangler secret put CLERK_SECRET_KEY
```

**Listener** (`apps/firstdue-listener`): the `deploy-listener` workflow bulk-syncs the
listener secrets from GitHub secrets on every deploy via `wrangler secret bulk`. To set
them manually:

```bash
cd apps/firstdue-listener
wrangler secret bulk ./secrets.json   # { "FIRSTDUE_API_KEY": "...", ... }
```

---

## GitHub secrets / vars inventory

The full inventory of GitHub Actions secrets and variables — and which workflow
consumes each — is maintained in one place: [`../docs/environment.md`](../docs/environment.md).

In short: `deploy-infra.yml` needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`R2_STATE_ACCESS_KEY_ID`, and `R2_STATE_SECRET_ACCESS_KEY`. Configure everything
under repo Settings → Secrets and variables → Actions.

---

## Outputs

```
tofu output web_hostname
tofu output listener_hostname
tofu output web_custom_domain_id
tofu output listener_custom_domain_id
tofu output clerk_dns_records        # the five Clerk CNAMEs (hostname -> target)
tofu output clerk_frontend_api_url   # must equal the CLERK_JWT_ISSUER_DOMAIN GitHub variable
```
