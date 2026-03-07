# ANTIGRAFTE-TASK.md — At Spaces Backend Build Plan (NestJS + Prisma)

This file is the **single source of truth** for how to build the backend.
Follow it **exactly**. Do not invent endpoints, rename routes, or change role names.

---

## 0) Inputs (Read in this exact order)
1. `README-ARCHITECTURE_FINAL.md`
2. `README-DATABASE_FINAL.md`
3. `README-SECURITY_FINAL.md` (or latest `README-SECURITY_FINAL_v3.md`)
4. `README-BACKEND_FINAL.md`
5. `README-API.md`
6. `openapi-atspaces.yaml`

---

## 1) Hard Rules (Non‑negotiable)
### 1.1 Roles
- Roles are **ONLY**: `customer`, `vendor`, `admin`
- No `super_admin`, no extra roles.

### 1.2 Auth model
- **Access token** returned in JSON.
- **Refresh token** stored ONLY in cookie:
  - `HttpOnly; Secure; SameSite=Strict; Path=/api`
- Refresh token rotation + revoke state stored in **Redis**.

### 1.3 Endpoints
- Implement endpoints **exactly** as defined in:
  - `openapi-atspaces.yaml` AND `README-API.md`
- If a conflict exists, resolve by **keeping the path & method from OpenAPI** and aligning request/response with README .

### 1.4 Security
- Admin portal mitigations must be implemented per security README:
  - Rate limiting, lockout, hCaptcha verification, MFA (TOTP), audit logging, security events logging.
- Enforce booking ownership checks (IDOR prevention) especially:
  - `GET /bookings/:id`
  - `GET /bookings/:id/calendar.ics`

### 1.5 Validation + Errors
- Use `class-validator` + `class-transformer` on all DTOs.
- Follow standard error format from `README-API_v2.md`.

### 1.6 Environments
- Use Docker Compose for **Postgres + Redis** in dev.
- Provide `.env.example` and never hardcode secrets.

---

## 2) Deliverables (Repository Output)
Produce a backend folder (monorepo-ready) with:

```
backend/
  docker-compose.yml
  .env.example
  package.json
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    main.ts
    app.module.ts
    common/
      config/
      guards/
      decorators/
      filters/
      interceptors/
      middleware/
      utils/
    modules/
      auth/
      users/
      services/
      branches/
      availability/
      bookings/
      vendors/
      admin/
      notifications/
      uploads/
      ai/
  test/
    ... (jest + supertest)
  README.md
```

---

## 3) Phased Work Plan (Do not skip phases)

### Phase 1 — Scaffold + Infra + Prisma (must run end-to-end)
**Goal:** project boots locally, DB & Redis run, Prisma migrations + seed work.

**Tasks:**
1. Create NestJS project (TypeScript).
2. Add dependencies:
   - `@nestjs/config`, `@nestjs/jwt`, `passport`, `passport-jwt`
   - `cookie-parser`
   - `class-validator`, `class-transformer`
   - `@prisma/client`, `prisma`
   - `ioredis`
   - `jest`, `supertest`
   - `@nestjs/swagger` + swagger ui
3. Add `docker-compose.yml` with:
   - Postgres 16
   - Redis 7
   - volumes + health checks
4. Add `.env.example` including:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `HCAPTCHA_SECRET`
   - `AWS_REGION`, `AWS_SES_*`, `AWS_S3_*`
5. Implement Prisma schema:
   - Convert `README-DATABASE_FINAL.md` tables into `schema.prisma`
   - Use soft delete (`deleted_at`) where required
6. Migrations:
   - `prisma migrate dev` works
7. Seed data:
   - Insert services: Hot Desk / Private Office / Meeting Room
   - Insert baseline facilities + features
   - Create 1 admin user (email/password from env) for testing

**Acceptance Criteria:**
- `docker compose up -d` works
- `npx prisma migrate dev` works
- `npx prisma db seed` works
- `GET /api/health` returns `{ "status": "ok" }`
- Swagger available at `/api/docs`

**Output:** commit “Phase 1 complete”.

---

### Phase 2 — Auth (Customer/Vendor/Admin) + Refresh Cookie + Redis
**Goal:** login flows are functional with correct cookie practices.

**Tasks:**
1. Implement access token issuance (JSON).
2. Implement refresh token cookie + rotation:
   - Store refresh session in Redis with TTL.
   - Revoke on logout.
3. Customer auth endpoints:
   - register email / register phone / verify OTP / login email / resend OTP / refresh / logout
4. Vendor auth endpoints:
   - login / refresh / logout
   - vendor registration (creates approval request + pending status)
5. Admin auth endpoints:
   - `/admin/auth/login` step 1:
     - verify captcha
     - lockout after 5 failures / 15 minutes
     - IP rate limit 20/10min
     - log failures to `security_events`
     - return `preAuthToken`
   - `/admin/auth/mfa/verify` step 2:
     - validate TOTP and issue full tokens
6. Password recovery endpoints:
   - customer/vendor forgot + reset
   - admin forgot + reset (requires TOTP)

**Acceptance Criteria:**
- Refresh cookie has correct flags.
- Admin login protections trigger at expected thresholds.
- MFA required for admin.

---

### Phase 3 — Public Browsing + Core Booking Flow
**Goal:** customer can browse branches/services, check availability, create bookings.

Implement (per OpenAPI):
- Services list + detail
- Branch list + search + detail (with facilities/services)
- Facilities + features catalogs
- Availability check
- Booking preview
- Create booking
- List my bookings
- Booking details (ownership)
- Cancel booking
- Calendar export ICS (ownership)

**Acceptance Criteria:**
- Booking validation: quantity>=1, start<end.
- IDOR checks enforced on booking detail + calendar export.

---

### Phase 4 — Vendor APIs
Implement:
- Vendor dashboard
- Vendor branches me + update
- Vendor services list + details
- Update price
- Capacity request (creates approval request + integrity hash/HMAC)
- Availability upsert
- Vendor bookings list + update status
- Facilities/features management

---

### Phase 5 — Admin APIs + Audit/Security Logs
Implement:
- Approval requests list/detail + approve/reject (reason min 10)
- Branch list + status update
- Vendor list + status update
- Analytics endpoint (aggregated)
- Reports export to S3 presigned URL (5 min)
- Audit log endpoint with pagination + date filters

Also ensure:
- `audit_log` insert-only (DB perms if feasible)
- Security events logged for failed logins, lockouts, MFA events

---

### Phase 6 — Tests + Final Verification
**Testing:**
Use Jest + Supertest:
- Admin brute-force / lockout / rate limit / captcha logic
- Booking validation (negative quantity, zero quantity, reversed time)
- Booking detail ownership
- Calendar export ownership
- Reject reason validation (min 10)
- Refresh rotation / revoked refresh cannot refresh

**Verification Checklist:**
- All endpoints exist and match OpenAPI.
- Swagger docs generated and accurate.
- Lint + tests pass.

---

## 4) Communication Rules (to prevent scope drift)
When something is unclear:
1) Do NOT guess new endpoints.
2) Ask only the minimum question needed OR propose a safe default that does not change contract.
3) Keep role names unchanged.

---

## 5) Final Output
Deliver:
- Full backend folder
- `README.md` runbook
- Swagger enabled
- All tests passing
- Brief summary of implemented endpoints and security controls
