# At Spaces — Backend (NestJS API)

Production backend for **At Spaces** (multi-branch coworking booking platform).

This service powers:
- Customer browsing, availability checks, booking + payment recording
- Vendor dashboard (capacity/pricing/facilities/features, bookings management, reports)
- Admin portal (branches/vendors, approvals, analytics, exports, security settings)

> For security requirements (Admin Portal), see: `README-SECURITY.md`.

---

## 1) Tech Stack
- **NestJS** (TypeScript) — REST API
- **Prisma ORM** + **PostgreSQL**
- **Redis** — rate limiting, lockouts, refresh rotation/revocation, admin inactivity TTL
- **Auth** — Access + Refresh JWT
  - Access: 10–15 minutes (Authorization header)
  - Refresh: 7–14 days (HttpOnly cookie) + rotation + revocation
- **MFA** — TOTP (RFC 6238) mandatory for admins
- **Email** — AWS SES (alerts + notifications)
- **Exports** — AWS S3 private bucket + pre-signed URLs (5 minutes)
- **Tests** — Jest + Supertest + Testcontainers (Postgres)

References:
- NestJS: https://docs.nestjs.com/
- Prisma (Nest recipe): https://docs.nestjs.com/recipes/prisma
- Prisma Migrate (dev vs prod): https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

---

## 2) Monorepo Layout (Backend-relevant)
```
atspaces/
  apps/
    api/                  # this service (NestJS)
  packages/
    db/                   # Prisma schema + migrations + PrismaClient export
    contracts/            # OpenAPI contract (source of truth)
  infra/
    docker/               # postgres + redis
```

### packages/db (DB package)
`packages/db/src/index.ts` exports a shared PrismaClient instance.

### apps/api Prisma integration
`apps/api/src/prisma/prisma.service.ts` wraps the shared client (adds lifecycle hooks if needed).

---

## 3) Backend Architecture (Clean Architecture — Light)
We use **modules** with clear boundaries. Inside each module we keep 4 folders:

- `domain/` — entities + ports (interfaces) + business errors
- `application/` — use-cases (business logic) + validators
- `infrastructure/` — Prisma repositories + mapping
- `presentation/` — controllers + HTTP DTOs + guards

Rule: Domain/Application must not depend on Nest/Prisma/HTTP.

---

## 4) Core Modules
Customer/Vendor:
- `auth`, `users`
- `branches`, `services`, `availability`
- `bookings`, `payments`
- `approvals` (vendor requests reviewed by admin)
- `facilities`, `features` (branch facilities + service features)
Optional:
- `conversations`, `messages` (AI chat history)

Admin:
- `admin` (dashboard, management)
- `analytics` (aggregated analytics endpoints)
- `audit-log` (super_admin only)

AI:
- `ai` (recommendations module inside API)

---

## 5) API Contract (Swagger / OpenAPI)
OpenAPI is the **source of truth** between Backend ↔ Frontend ↔ AI.

### Dev URLs (default)
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

### Contract file location
- `packages/contracts/openapi/openapi.yaml`

\1

### Export OpenAPI to the repo
Recommended script (example):
```bash
pnpm --filter @atspaces/api openapi:export
```
This script should fetch `/docs-json` and write `packages/contracts/openapi/openapi.yaml`.


---

## 6) Environment Variables
Create `apps/api/.env` from `.env.example`.

### Required (minimum)
- `PORT=3000`
- `DATABASE_URL=postgresql://postgres:password@localhost:5432/atspaces`
- `REDIS_URL=redis://localhost:6379`

### JWT / Cookies
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `ACCESS_TOKEN_TTL_MIN=15`
- `REFRESH_TOKEN_TTL_DAYS=14`
- `COOKIE_NAME_REFRESH=atspaces_admin_rt`
- `COOKIE_DOMAIN=` (prod domain)
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=Strict`

### Security (Admin)
- `HCAPTCHA_SECRET=...`
- `AWS_REGION=...`
- `SES_FROM_EMAIL=...`
- `SES_SECURITY_TEAM_INBOX=...`

### Reports / Exports
- `S3_BUCKET_PRIVATE_REPORTS=...`
- `S3_PRESIGN_EXP_SECONDS=300`

### Integrity / Signing
- `HMAC_APPROVAL_REQUESTS_KEY=...`
- `HMAC_VENDOR_NOTIFICATIONS_KEY=...`

> Never hardcode secrets. Use environment variables only.

---

## 7) Local Development (Step-by-step)

### Step 1 — Start Infra (Postgres + Redis)
From repo root:
```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

### Step 2 — Install dependencies
```bash
pnpm install
```

### Step 3 — DB: Prisma setup + migrations + seed
> If `packages/db/prisma/schema.prisma` is not created yet, start with:
```bash
pnpm --filter @atspaces/db prisma init
```
Then implement the models, and continue below.

> Use package filters so commands run in the correct workspace.
> Use package filters so commands run in the correct workspace.
```bash
pnpm --filter @atspaces/db prisma generate
pnpm --filter @atspaces/db prisma migrate dev --name init_schema
pnpm --filter @atspaces/db prisma db seed
```

### Step 4 — Start the API
```bash
pnpm --filter @atspaces/api start:dev
```

---

## 8) Production Notes (Important)
Production must use:
```bash
pnpm --filter @atspaces/db prisma migrate deploy
```

Do **not** use `migrate dev` in production.

---

## 9) Authentication Model (Implementation Contract)

### Access token
- Returned by login/refresh as a string.
- Client sends it on every request:
  `Authorization: Bearer <access_token>`

### Refresh token
- Stored only in **HttpOnly cookie** (Secure + SameSite=Strict).
- Rotation on every refresh.
- Revocation list / rotation state stored in **Redis**.

### Admin inactivity TTL (30 minutes)
- Admin requests update a `last_seen` value in Redis.
- If inactive > 30 minutes: refresh token is revoked and user must login again.

---

## 10) Security Requirements (Admin Portal)
Security controls are defined in `README-SECURITY.md`, including:
- brute-force protection + lockouts + CAPTCHA
- RBAC (`super_admin`, `branch_manager`, `analytics_admin`)
- IDOR prevention (ownership checks)
- immutable audit logging (`audit_log`) + auth events (`security_events`)
- MFA (TOTP + backup codes hashed)
- S3 pre-signed URL exports + audit trail

---

## 11) Suggested Packages (Backend)
These are commonly used for this stack (final selection may vary):
- `@nestjs/config`, `@nestjs/jwt`, `passport`, `passport-jwt`
- `cookie-parser`, `helmet`
- `@nestjs/swagger`
- `ioredis` or `redis`
- `otplib` (TOTP)
- AWS SDK v3: `@aws-sdk/client-ses`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- Testing: `jest`, `supertest`, `testcontainers`

---

## 12) Testing

### Unit tests
```bash
pnpm --filter @atspaces/api test
```

### E2E / integration tests (with Testcontainers)
```bash
pnpm --filter @atspaces/api test:e2e
```

Minimum security test cases (must-have):
- lockout triggers at exactly 5 failed logins
- CAPTCHA required after 3 failed attempts
- IDOR blocked on admin profile update
- self-permission escalation blocked
- audit_log receives entries for sensitive actions

---

## 13) CI Expectations
CI should run on every PR:
1) install
2) lint
3) build
4) unit tests
5) e2e tests
6) prisma validate / migrations sanity checks
7) (optional) OpenAPI export consistency

---

## 14) Frontend Integration (Quick)
Frontend should set:
- `VITE_API_URL=http://localhost:3000`

Calls:
- Login returns access token (store in memory) + sets refresh cookie automatically.
- Every API call includes `Authorization: Bearer <access>`.

CORS:
- Configure allowed origins for local + production frontend domains.

---

## 15) Troubleshooting
- Prisma client mismatch → run `prisma generate`
- Migration conflicts → never edit migrations manually unless you know exactly why
- Redis connection errors → check `REDIS_URL` and docker container
- Cookies not set in local dev → ensure using HTTP (Secure cookies only in HTTPS) or set COOKIE_SECURE=false in local dev only
