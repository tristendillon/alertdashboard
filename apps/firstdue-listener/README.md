# firstdue-listener

Background service that polls the First Due API (dispatches, weather, hydrants)
and writes to Convex. It exposes a small HTTP API plus a WebSocket log stream.

It is deployed as a Docker image on **Cloudflare Containers**, supervised by a
Worker (`worker/index.ts`) that proxies HTTP + WebSocket traffic to the single
container instance and keeps it alive via a cron `/health` probe.

## Logging

Logging is **stdout-only** (container disks are ephemeral):

- **TTY (local dev):** pretty, colorized output.
- **Non-TTY (docker / Cloudflare):** single-line JSON per entry.

Recent logs are kept in an in-memory **ring buffer** (last ~2000 entries). This
history is **volatile** — it is cleared on every restart. Cloudflare
observability retains stdout separately.

## HTTP API

Auth: pass `?API_KEY=<key>` on every request. If `API_KEY` is unset the service
runs fully open and logs a warning on each request. `/health` is always
unauthenticated.

| Route | Description |
| --- | --- |
| `GET /health` | Unauthenticated liveness probe: `{ status, uptime, timestamp }`. |
| `GET /api/logs` | Ring-buffer history. Query: `level`, `context` (comma lists), `since`, `until`, `search`, `limit` (max 1000), `offset`. Returns `{ logs, total, limit, offset, bufferCapacity }`. |
| `GET /api/logs/stream-info` | WebSocket connection info. |
| `GET /api/routines/:name/*` | Per-routine control/status (`start`, `stop`, `execute`, `status`, `logs`, `stats`). |
| `WS /ws/logs` | Real-time log stream (auth via `?API_KEY=`). |

### Client-facing changes (from the VPS era)

- Base URL is now the Worker host (`*.workers.dev`, later
  `listener.alertdashboard.com`).
- `GET /api/logs` history is **volatile** (in-memory ring buffer), not
  file-backed.
- `GET /api/logs/files` has been **removed** (no on-disk log files).
- `GET /health` was **added** (unauthenticated).
- Auth is unchanged (`?API_KEY=`).

## Local development

```bash
cp .env.example .env   # then fill in real values (see .env.example)
pnpm dev               # tsup watch + node dist/index.js
```

`.env` is loaded via dotenv only when `NODE_ENV !== production`. All env vars
are validated on boot with zod; missing/invalid required vars print one line
each and exit(1).

## Docker

Built with the **repo root as context** (the multi-stage build needs the whole
pnpm/turbo workspace):

```bash
pnpm docker:build   # docker build -f Dockerfile -t firstdue-listener ../..
pnpm docker:run     # docker run --rm --env-file .env -p 8080:8080 firstdue-listener
```

## Cloudflare deploy

Config lives in `wrangler.jsonc`. Non-secret values are `vars`; secrets are set
separately (never committed).

```bash
pnpm cf:types    # regenerate worker-configuration.d.ts after editing wrangler.jsonc
pnpm cf:dev      # local wrangler dev (builds + runs the container)
pnpm cf:deploy   # wrangler deploy (the runner builds the Docker image)
```

> The pnpm-reserved `deploy` script name is intentionally avoided; use
> `cf:deploy`.

### Secrets

Non-secret config (`TIMEZONE`, `LOG_LEVEL`, `WEATHER_LAT/LNG`, `WEATHER_UNITS`,
`CONVEX_URL`) is in `wrangler.jsonc` `vars`. Secrets are set once per
environment with `wrangler secret put` (or `wrangler secret bulk` in CI):

```bash
wrangler secret put FIRSTDUE_API_KEY
wrangler secret put WEATHER_API_KEY
wrangler secret put CONVEX_API_KEY
wrangler secret put API_KEY
```

The supervisor Worker forwards these into the container's process env
(`FirstdueListenerContainer.envVars`). In CI these come from GitHub secrets; the
full reference is in [`../../docs/environment.md`](../../docs/environment.md), and
the deploy pipeline is in [`../../docs/deployment.md`](../../docs/deployment.md).

> Confirm `WEATHER_LAT/LNG` and `CONVEX_URL` in `wrangler.jsonc` are correct
> before the first deploy.

## Prerequisites

Cloudflare **Workers Paid** is required for Containers.
