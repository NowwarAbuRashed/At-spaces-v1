# At Spaces — Security (Admin Portal) Implementation Guide (v3)
Target: Production-ready mitigations for the **Admin Portal** of a multi-branch coworking platform.

## 0) Scope & Roles
This document covers **Admin Portal** security controls only.

**System roles (only these 3):**
- `customer`
- `vendor`
- `admin`

> There is **no `super_admin`** and no multi-tier admin RBAC in v1.
> Therefore:
> - All `/admin/*` endpoints require `admin`.
> - Any endpoint that would modify **another admin account** is **out of scope** (blocked) until an admin-RBAC/permissions model is introduced.

Security references:
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- RFC 6238 (TOTP): https://www.rfc-editor.org/rfc/rfc6238

---

## 1) Security Docs Index (for Antigrafte)
- ✅ **This document**: Admin Portal controls
- 📄 Customer security: `customer_threat_model.docx` + `customer_mitigation_prompt.docx`
- 📄 Vendor security: `vendor_threat_model.docx` + `vendor_mitigation_prompt.docx`

Traceability rule:
- Each implemented control should reference Threat IDs from the threat models in **code comments** and **tests**.

---

## 2) Security Architecture Summary
- Backend: **NestJS REST API**
- DB: **PostgreSQL** (Prisma ORM)
- Cache/State: **Redis** (rate-limit, lockouts, refresh rotation, inactivity)
- Auth: **Access + Refresh JWT**
  - Refresh in **HttpOnly + Secure + SameSite=Strict** cookie
  - Access short-lived (10–15 min)
  - Refresh long-lived (7–14 days) with **rotation** + **revocation**
- MFA: **TOTP (RFC 6238)** mandatory for all admins
- Email alerts: **AWS SES**
- Report exports: **AWS S3** private bucket + **pre-signed URLs (5 min)** + **encryption at rest (SSE)**
- Audit tables:
  - `security_events`: auth attempts, lockouts, MFA events, reset events
  - `audit_log`: branch changes, approvals, exports, admin settings changes

---

## 3) Environment Variables (No secrets in code)
### JWT / Cookies
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL_MIN=15`
- `REFRESH_TOKEN_TTL_DAYS=14`
- `COOKIE_SECURE=true` (set false only in local dev)
- `COOKIE_SAMESITE=Strict`
- `COOKIE_DOMAIN=<TBD>`
- `COOKIE_NAME_REFRESH=atspaces_admin_rt`

### Redis
- `REDIS_URL=redis://localhost:6379`

### hCaptcha
- `HCAPTCHA_SECRET`
- `HCAPTCHA_SITE_KEY`

hCaptcha verification docs:
- https://docs.hcaptcha.com/

### AWS SES
- `AWS_REGION=<TBD>`
- `SES_FROM_EMAIL=<TBD>` (verified sender)
- `SES_SECURITY_TEAM_INBOX=<TBD>`

AWS SES docs:
- https://docs.aws.amazon.com/ses/

### AWS S3 (Exports)
- `S3_BUCKET_PRIVATE_REPORTS=<TBD>`
- `S3_PRESIGN_EXP_SECONDS=300`
- `S3_SSE_MODE=SSE-S3` (or `SSE-KMS`)
- `S3_KMS_KEY_ID=<optional-if-using-SSE-KMS>`

S3 SSE docs:
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html
Presigned URL docs:
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html

### HMAC keys
- `HMAC_APPROVAL_REQUESTS_KEY`
- `HMAC_VENDOR_NOTIFICATIONS_KEY`

---

## 4) Authentication & Session Controls (Admin)

### [M-01] Brute-force & Credential Stuffing Protection
Endpoint: `POST /admin/login`

Controls:
1) Account lockout: 15 minutes after 5 consecutive failed attempts (per email)
2) IP-based rate limiting: max 20 attempts per IP per 10 minutes (Redis-based)
3) CAPTCHA required after 3rd failed attempt (hCaptcha)
4) Log every failed attempt in `security_events`:
   - hashed email, IP, user-agent, timestamp, outcome
5) On lockout: send email alert to admin + dashboard notification

Notes:
- Use constant-time password verification
- Avoid user enumeration (same response for “wrong email” vs “wrong password”)

### [M-02] Session Token Security (Access+Refresh)
- Refresh token stored as cookie:
  - HttpOnly, Secure, SameSite=Strict
- Enforce HTTPS-only (redirect HTTP → HTTPS at reverse proxy / app)
- Security headers:
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options
  - Referrer-Policy
- Session inactivity TTL: 30 minutes
  - track last activity in Redis
  - revoke refresh token state on timeout

### [M-03] Password Reset Hardening + Step-up MFA
Treat reset endpoints like authentication endpoints:
- Reset tokens: >= 32 bytes, URL-safe, cryptographically random
- Expiry: 15 minutes, single-use
- Rate limit: max 3 requests per email per hour
- Do NOT expose tokens in URL params that might be logged
- Log reset requests/outcomes in `security_events`

**Step-up requirement (admins must have MFA):**
- At reset completion require valid TOTP (or unused backup code) before issuing a session.
- Send email alert on successful password reset (timestamp + IP).

---

## 5) Authorization & Access Control (Admin)

### [M-04] Require Admin Auth on /admin/*
Create `requireAdminAuth` guard/middleware:
- Valid access token required on every `/admin/*` route
- Return:
  - 401 unauthenticated
  - 403 unauthorized (do not hide with 404)

### [M-05] Branch Data Access Control
`GET /admin/branches/:id`
- Must require admin auth (401/403 on failure)

### Branch Status Changes (Admin-only)
`PATCH /admin/branches/:id/status`
- Only `admin`
- Write immutable audit log entry:
  `{ actor_id, action, target, old_value, new_value, ip, user_agent, timestamp }`

### [M-06] Vendor Approval Safety (Admin-only)
`POST /admin/vendors/:id/approve`
- Only `admin`
- Defense-in-depth: prevent accidental self-approval
  (even though admin/vendor identities are separate by policy)
- Log approval action to `audit_log`
- DB-level trigger/logging recommended to capture approving admin id

### [M-08] Profile IDOR Prevention (Admin)
Because there is no super_admin:
`PATCH /admin/profile/:id`
- Allow only if `:id == authenticated admin id`
- Otherwise return **403** (always)

> Any cross-admin management endpoints (permissions/roles/admin edits) are **not allowed** in v1.

---

## 6) Mandatory MFA (TOTP)

### [M-09] Enforce MFA for All Admins
- TOTP enrollment required
- Use RFC 6238 compatible TOTP (Google Authenticator compatible)
- Generate 8 backup codes, store **hashed**, single-use

### MFA Login Flow
1) Email/password correct → issue 5-minute pre-auth token
2) Verify TOTP → issue access token + refresh cookie

### [M-10] 2FA Disable Hardening
To disable MFA require:
- current password + valid live TOTP in same request
- email alert with timestamp + IP
- audit_log entry

---

## 7) Audit Logging (Immutable)

### [M-11] Immutable audit_log
Create `audit_log` with:
`{ id, actor_id, actor_role, action, target_type, target_id, old_value(jsonb), new_value(jsonb), ip_address, user_agent, created_at }`

DB permissions:
- Grant INSERT-only to application DB user
- No UPDATE/DELETE

Audit entries required for:
- login, logout, failed login
- branch status change
- vendor approve/suspend
- approval request decision
- report export
- MFA enable/disable
- admin settings changes

Audit endpoint:
`GET /admin/audit-log`
- admin-only
- pagination + date range filters

---

## 8) Approval Requests

### [M-12] Capacity Request Integrity
`POST /vendor/capacity-requests`
- Validate bounds server-side (422 on out of range)
- Store HMAC-SHA256 of payload at submission time
- On admin review (`GET /admin/requests/:id`) recompute and show hash

### [M-13] Rejection Reason Persistence
`POST /admin/requests/:id/reject`
- require non-empty reason (min 10 chars) or return 400
- store reason in DB
- log vendor notification dispatch + delivery status

### DoS/Flood protection (Vendor requests)
To mitigate request flooding:
- Rate limit `/vendor/capacity-requests` per vendor + per IP (Redis)
- Enforce max pending requests per vendor (e.g., 3)
- Log anomalies to `security_events`

---

## 9) Analytics & Reports

### [M-14] Analytics Scoping
All `/admin/analytics/*`:
- require admin auth
- return aggregated data (no PII by default)
- validate/whitelist filters (city, date range, service type)

### [M-15] Report Export Security
- Log every export in `audit_log`
- Store exports in private S3 bucket
- Encrypt at rest using SSE-S3 or SSE-KMS
- Serve via pre-signed URL (5 minutes)
- Minimize data; include PII only if explicitly required (and always audit)

---

## 10) Dashboard
All `/admin/dashboard/*`:
- require admin auth
- set `Cache-Control: no-store`
- never allow shared/public caching

---

## 11) Vendor Notifications Integrity
- Sign outbound vendor notification payloads with HMAC-SHA256
- Include `notification_id` + timestamp
- Webhooks are future scope; if enabled:
  - per-vendor secret key
  - vendors verify signature

---

## 12) Testing
- Unit + integration tests required for each mitigation
- Jest + Supertest
- Integration tests use Testcontainers (Postgres; Redis container if needed)

Testcontainers docs:
- https://node.testcontainers.org/
