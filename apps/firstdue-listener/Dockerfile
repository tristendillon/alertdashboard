# Build with the repo root as context:
#   docker build -f apps/firstdue-listener/Dockerfile -t firstdue-listener .
# (Cloudflare Containers builds it via wrangler with image_build_context "../..".)

# Builder stage
FROM node:22-alpine AS builder

RUN npm install -g pnpm@11.9.0
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/convex/package.json ./apps/convex/
COPY apps/firstdue-listener/package.json ./apps/firstdue-listener/
# web is part of the pnpm workspace + lockfile; its manifest must be present so the
# frozen-lockfile install sees a workspace set matching the lockfile (web source is NOT copied).
COPY apps/web/package.json ./apps/web/
# workspace packages referenced by the apps' package.jsons — pnpm needs their manifests to install.
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
# Filtered install: only the listener and its workspace deps — skips downloading
# web's heavy tree (next/swc/workerd/...) entirely.
RUN pnpm install --frozen-lockfile --filter @sizeupdashboard/firstdue-listener...

COPY apps/convex ./apps/convex
COPY apps/firstdue-listener ./apps/firstdue-listener
COPY packages ./packages
# tsup bundles the app + ALL deps (incl. @sizeupdashboard/convex) into a
# self-contained dist/, so the runtime stage needs no node_modules.
RUN pnpm --filter @sizeupdashboard/firstdue-listener build

# Final stage
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/apps/firstdue-listener/dist ./dist
EXPOSE 8080
# Run node directly (no pnpm wrapper) so SIGTERM reaches Node for graceful shutdown.
CMD ["node", "dist/index.js"]
