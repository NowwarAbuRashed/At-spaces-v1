# At Spaces Backend

NestJS + Prisma + PostgreSQL + Redis backend for At Spaces.

This README is the Phase 7 production runbook.

## 1) Health endpoint

- `GET /api/health` -> `{"status":"ok"}`
- `GET /api/version` -> `{"version":"1.0.0"}`

## 2) Environment configuration

Copy `.env.example` to `.env` and set real values.

```bash
cp .env.example .env
```

Startup now uses strict env validation and fails fast if required values are missing/invalid.

### Required env groups

- Core: `DATABASE_URL`, `REDIS_URL`, `NODE_ENV`, `PORT`
- JWT/session: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_*`
- Security: `HCAPTCHA_SECRET`, `HCAPTCHA_SITE_KEY`, `HMAC_APPROVAL_REQUESTS_KEY`, `HMAC_VENDOR_NOTIFICATIONS_KEY`
- AWS region + email: `AWS_REGION`, `AWS_SES_FROM_EMAIL`, `AWS_SES_SECURITY_TEAM_INBOX`, `SES_FROM_EMAIL`, `SES_SECURITY_TEAM_INBOX`
- AWS S3 reports: `AWS_S3_*` and `S3_*` report variables
- Production controls: `ENABLE_SWAGGER`, `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY`, `LOG_LEVEL`

### Dev vs production behavior

- `ENABLE_SWAGGER` defaults to `true` in non-production and `false` in production.
- In production:
  - `COOKIE_SECURE` must be `true`
  - `CORS_ALLOWED_ORIGINS` must be configured (non-empty)
  - `HCAPTCHA_TEST_BYPASS` must be `false`
  - critical secrets must be at least 32 chars

## 3) Local development workflow

1. Start infra:

```bash
docker compose up -d
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run development migrations:

```bash
npm run prisma:migrate:dev -- --name <migration_name>
```

5. Seed data (optional):

```bash
npm run prisma:seed
```

6. Start API:

```bash
npm run start:dev
```

## 4) Production workflow (safe)

Do not use `prisma migrate dev` in production.

Use startup order:

1. PostgreSQL
2. Redis
3. Prisma migrations (`prisma migrate deploy`)
4. Backend app

### Production commands

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start:prod
```

### Prisma production checks

```bash
npm run prisma:validate
```

## 5) Docker production image

Build:

```bash
docker build -t atspaces-backend:prod .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env atspaces-backend:prod
```

Notes:

- Multi-stage Docker build is used.
- Runtime container runs as non-root `node` user.
- Container healthcheck calls `GET /api/health`.

## 6) Swagger / docs strategy

- Docs path is controlled by `SWAGGER_PATH` (default `api/docs`).
- Enable or disable via `ENABLE_SWAGGER=true|false`.
- Recommended production default: `ENABLE_SWAGGER=false` unless explicitly required.

## 7) Logging & observability

Implemented:

- Structured JSON logs
- Request/response logging interceptor
- Correlation ID (`X-Request-Id`) middleware
- Error logging with secret redaction

Log levels:

- `info`
- `warn`
- `error`

Security and audit events remain persisted via existing `security_events` and `audit_log` database writes.

## 8) CORS / proxy / HTTPS readiness

Environment-driven CORS:

- `CORS_ALLOWED_ORIGINS` as comma-separated origins
- `CORS_ALLOW_CREDENTIALS=true` for cookie auth

Reverse proxy support:

- set `TRUST_PROXY` when behind Nginx/load balancer (for forwarded HTTPS/IP headers)
- keep `COOKIE_SECURE=true` in production HTTPS environments

Example Nginx forwarding headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## 9) CI/CD workflows

Provided workflows:

- `.github/workflows/backend-ci.yml`
  - install
  - lint
  - tests
  - Prisma validate
  - build
- `.github/workflows/backend-migrate.yml`
  - manual production migration job (`prisma migrate deploy`)

## 10) Troubleshooting

- `Environment validation failed`: required env values are missing or malformed; fix `.env`.
- `Missing required config`: check relevant env var exists and is non-empty.
- `Prisma client out of date`: run `npm run prisma:generate`.
- `Migrations fail in production`: verify DB connectivity and run `npm run prisma:migrate:deploy`.
- `Secure cookie not set`: in production, ensure HTTPS + proxy headers + `TRUST_PROXY`.
- `CORS blocked`: verify `CORS_ALLOWED_ORIGINS` exactly matches frontend origin.
- `Swagger unavailable`: check `ENABLE_SWAGGER` and `SWAGGER_PATH`.

## 11) Production verification checklist

- [ ] App starts with `NODE_ENV=production`.
- [ ] `prisma migrate deploy` completes successfully.
- [ ] Redis connection is healthy.
- [ ] Refresh cookies are `HttpOnly`, `Secure`, and `SameSite`.
- [ ] Swagger is disabled unless `ENABLE_SWAGGER=true`.
- [ ] `GET /api/health` returns `{"status":"ok"}`.
- [ ] Logs are structured JSON and include `X-Request-Id`.
- [ ] CI checks pass (lint, tests, prisma validate, build).
