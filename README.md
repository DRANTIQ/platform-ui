# platform-ui

Customer-facing dashboard for Platform V2 — tenants, scans, assets, findings, CIS compliance.

## API

Calls **compliance-engine** only (`platform-api`):

- `GET/POST /v1/scans`
- `GET /v1/assets`, `/v1/assets/search`
- `GET /v1/findings`
- `GET /v1/compliance/...`

Never talks to collectors or workers directly.

## Auth

JWT — roles: `tenant_admin`, `viewer` (per tenant).

## Related repos

| Repo | Role |
|------|------|
| **compliance-engine** | Backend API |
| **platform-ui** | **This repo** |
| **admin-ui** | Internal ops (separate app, separate ingress) |
| **platform-collectors** | Collection (no UI access) |
| **platform-db** | Database migrations |

## Planning

**infra-state-docs/new arch/docs/** — Phase 4 in `BUILD_GUIDE.md`

Reference UX patterns: legacy `cloud-compliance-ui` (ideas only).

## Stack (TBD at implementation)

Likely: React + TypeScript + Vite. Confirm when Phase 4 starts.

## Local dev (after scaffold)

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Status

Initial repo scaffold — UI work starts Phase 4 (~week 17). Backend API Phase 1–3 first.
