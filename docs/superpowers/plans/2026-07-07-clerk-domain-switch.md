# Clerk Domain Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move production domain and Clerk configuration to `mfdalertdashboard.com`.

**Architecture:** Keep `deploy.config.json` as the only source of truth. Existing OpenTofu and GitHub Actions logic derives Clerk DNS, Clerk publishable key, and Convex issuer from that file.

**Tech Stack:** Node.js validation script, OpenTofu Cloudflare DNS resources, GitHub Actions deployment config.

---

### Task 1: Update Production Source Of Truth

**Files:**
- Modify: `deploy.config.json`
- Modify: `docs/environment.md`
- Modify: `scripts/check-deploy-config.mjs`

- [ ] **Step 1: Update `deploy.config.json`**

Set:

```json
{
  "zoneName": "mfdalertdashboard.com",
  "webWorkerName": "alertdashboard",
  "listenerWorkerName": "firstdue-listener",
  "webHostname": "mfdalertdashboard.com",
  "listenerHostname": "listener.mfdalertdashboard.com",
  "clerkInstanceSlug": "g6fa3egr21kb"
}
```

- [ ] **Step 2: Update documented current values**

In `docs/environment.md`, update the current production table to list the new
zone, web host, listener host, and Clerk instance slug.

- [ ] **Step 3: Run validation**

If the validator rejects `webHostname` when it equals `zoneName`, update the
hostname check to accept either the zone apex or a subdomain of the zone.

Run: `node scripts/check-deploy-config.mjs`

Expected: `check-deploy-config: OK`

### Task 2: Review Final Diff

**Files:**
- Review: `deploy.config.json`
- Review: `docs/environment.md`
- Review: `scripts/check-deploy-config.mjs`
- Review: `docs/superpowers/specs/2026-07-07-clerk-domain-switch-design.md`
- Review: `docs/superpowers/plans/2026-07-07-clerk-domain-switch.md`

- [ ] **Step 1: Inspect diff**

Run: `git diff -- deploy.config.json docs/environment.md scripts/check-deploy-config.mjs docs/superpowers/specs/2026-07-07-clerk-domain-switch-design.md docs/superpowers/plans/2026-07-07-clerk-domain-switch.md`

Expected: Only the approved domain/Clerk changes and planning docs are present.
