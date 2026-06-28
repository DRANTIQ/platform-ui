# platform-ui

Customer dashboard for **Platform V2** — reads from `compliance-engine` API (`/v1/*`).

## Phase 4b — Supabase Auth

Design-partner login via Supabase; API verifies JWT (HS256) and resolves `platform.tenant_memberships`.

### Prerequisites

1. **Backend** running with Supabase JWT env (see `compliance-engine/.env.example`)
2. **Supabase user** created (Auth → Users)
3. **Membership seeded** for that user's JWT `sub`:

```bash
cd compliance-engine
python scripts/seed_identity_membership.py \
  --tenant-id <tenant-uuid> \
  --auth-issuer https://<project-ref>.supabase.co/auth/v1 \
  --auth-subject <supabase-user-sub-uuid> \
  --email partner@company.com \
  --role tenant_admin
```

Get `sub` from Supabase Dashboard → Authentication → Users, or decode the access token.

### Backend env (`compliance-engine/.env`)

```bash
OIDC_ENABLED=true
SUPABASE_URL=https://<project-ref>.supabase.co
OIDC_JWT_SECRET=<JWT Secret from Supabase Project Settings → API>
OIDC_AUDIENCE=authenticated
DEV_TENANT_HEADER_AUTH=true   # keep true locally so dev headers still work as fallback
```

JWT Secret: Supabase Dashboard → **Project Settings → API → JWT Secret** (not the anon key).

### UI setup

```bash
cp .env.example .env
# Set VITE_AUTH_MODE=supabase, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5173 → redirects to **Sign in**.

## Deploy to Vercel (app.drantiq.ai)

Vite env vars are **baked in at build time**. Set these on the Vercel project, then redeploy:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://api.drantiq.ai` — **not** `https://app.drantiq.ai` |
| `VITE_AUTH_MODE` | `supabase` |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

This repo includes `vercel.json` so routes like `/login` and `/scans/:id` serve `index.html` (SPA fallback).

Supabase Dashboard → **Authentication → URL configuration**:

- **Site URL:** `https://app.drantiq.ai`
- **Redirect URLs:** `https://app.drantiq.ai/**`

If login succeeds but the dashboard fails, confirm `https://api.drantiq.ai/health` returns `healthy` and CORS allows your UI origin.

### Auth modes

| `VITE_AUTH_MODE` | Behavior |
|------------------|----------|
| `supabase` | Login page + Bearer JWT |
| `dev_headers` | No login; `X-Tenant-ID` / `X-Role` |

### Pages

- **Login** — Supabase email/password
- **Dashboard** — CIS score, failures, latest scan
- **Scans** — list + run scan
- **Scan detail** — findings, assets, CIS, timeline

### Migrate to Cognito later

Change backend `OIDC_ISSUER` / JWKS (or JWT secret) and UI to Cognito Hosted UI. Re-seed `tenant_memberships` with new `auth_issuer` + `sub`. No product code rewrite.
