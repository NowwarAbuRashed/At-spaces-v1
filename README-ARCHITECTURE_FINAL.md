# At Spaces - Architecture Overview (NestJS + Prisma)

## 1) What is At Spaces?
**At Spaces** is a workspace booking platform connecting:
- **Customers**: browse branches/services, check availability, create/cancel bookings.
- **Vendors**: manage branch/service pricing/capacity/availability and vendor bookings.
- **Admins**: review approvals, manage branches/vendors, analytics, reporting, and audit access.

The backend also includes an **AI module** endpoint (`/ai/recommend`) as a safe stub in the current implementation.

---

## 2) Implemented High-Level Architecture
The current backend is implemented as a **standard NestJS modular monolith**:
- **Frontend (Web/App)** consumes REST APIs.
- **Backend (NestJS API)** organized by feature modules.
- **Database** is PostgreSQL accessed through Prisma.
- **Redis** handles refresh-session state, rate limits, lockouts, and activity TTLs.
- **Contract** is OpenAPI (`openapi-atspaces.yaml`) with Swagger in non-production environments.

---

## 3) Implemented Backend Structure
Current structure is:

```text
backend/src/
  app.module.ts
  main.ts
  common/
    config/ decorators/ email/ filters/ guards/ interceptors/
    interfaces/ logging/ middleware/ prisma/ redis/ utils/ validators/
  modules/
    auth/ users/ services/ branches/ availability/ bookings/
    vendors/ admin/ notifications/ uploads/ ai/
  health/
```

Inside each feature module, the implemented pattern is:
- `*.controller.ts` for HTTP routes
- `*.service.ts` for business/application logic
- `dto/` for request/response validation and Swagger schemas
- `*.module.ts` for Nest dependency wiring

This is the architecture currently in production scope.

---

## 4) Cross-Cutting Layers
Shared backend concerns are implemented under `src/common`:
- **AuthN/AuthZ**: JWT guard + role guard + role decorator
- **Validation**: global `ValidationPipe` with DTO validation
- **Error handling**: global standard exception filter
- **Security headers**: middleware (CSP, X-Content-Type-Options, Referrer-Policy, etc.)
- **Structured logging**: request interceptor + app logger + request ID context
- **Config validation**: startup environment schema validation
- **Infrastructure services**: global Prisma and Redis modules/services

---

## 5) Data Access Layer
Prisma is the data access layer for all modules:
- `PrismaService` is globally provided and used inside services.
- Queries use Prisma Client and transactions.
- No repository abstraction layer is currently applied on top of Prisma.

---

## 6) Core Modules (Implemented)
- `auth`
- `users`
- `services`
- `branches`
- `availability`
- `bookings`
- `vendors`
- `admin`
- `notifications`
- `uploads`
- `ai`

---

## 7) API Contract Source of Truth
OpenAPI is the contract source of truth for implemented endpoints:
- Contract file: `openapi-atspaces.yaml`
- Swagger UI: `/api/docs` (controlled by environment)
- OpenAPI JSON: `/api/docs-json` (when Swagger is enabled)

---

## 8) Security Baseline (Implemented)
- Role model: `customer`, `vendor`, `admin`
- Ownership checks to prevent IDOR on sensitive resources
- DTO validation (`class-validator` + `class-transformer`)
- Admin protections: rate limiting, lockout, hCaptcha verification, MFA (TOTP)
- Security and audit persistence via `security_events` and `audit_log`

---

## 9) Future Improvement Note
A deeper per-module Clean Architecture split (`domain/application/infrastructure/presentation`) is a **future refactor option**.

It is **not** the current implementation model. The current codebase intentionally uses NestJS feature modules with controller/service/dto separation.

---

## 10) Where to Start
- Read `README-DATABASE_FINAL.md` for schema and migration workflow.
- Read `README-BACKEND_FINAL.md` for backend runtime and deployment guidance.
- Read `README-API.md` and `openapi-atspaces.yaml` for API contract details.