# Release Notes v1

Date: 2026-03-08

## Scope

This release addresses staging blockers only:

1. Backend e2e instability and deadlocks.
2. Frontend admin route protection and refresh-failure behavior.
3. Admin report export behavior in environments without ready S3 credentials.
4. Delivery/package cleanup artifacts.

## Changes

### Backend

- Stabilized e2e DB resets by introducing deterministic reset helper:
  - `backend/test/helpers/e2e-db-reset.ts`
  - Avoids deadlock-prone multi-table truncate flows.
  - Handles append-only `audit_log` by using targeted `TRUNCATE audit_log` then ordered deletes.
- Updated e2e suites to use shared reset helper and consistent timeout:
  - `backend/test/auth.e2e-spec.ts`
  - `backend/test/phase3.e2e-spec.ts`
  - `backend/test/phase4.e2e-spec.ts`
  - `backend/test/phase5.e2e-spec.ts`
- Hardened admin report export response contract for non-ready environments:
  - `backend/src/modules/admin/admin.service.ts`
  - `backend/src/modules/admin/dto/report-export-response.dto.ts`
  - Response now explicitly reports `status: ready | unavailable`.
  - Non-production unavailable storage path returns safe `unavailable` response instead of opaque runtime failure.

### Frontend

- Added protected admin route guard:
  - `frontend/src/app/routes.tsx`
  - Unauthenticated access to admin routes redirects to `/login`.
- Improved route tests with deterministic storage mocks:
  - `frontend/src/app/routes.test.tsx`
- Updated analytics export UX for explicit backend availability states:
  - `frontend/src/pages/management/analytics-page.tsx`
  - `frontend/src/types/api.ts`
- Removed insecure default captcha token fallback from frontend env config:
  - `frontend/src/lib/env.ts`
- Hardened smoke script for guarded routes and optional UI interactions:
  - `frontend/scripts/playwright-smoke.mjs`
- Replaced generic frontend README with actual run/build/test/smoke instructions:
  - `frontend/README.md`

## Validation Summary

- Backend: lint, OpenAPI validation, e2e, detectOpenHandles all passing.
- Frontend: typecheck, lint, tests, build all passing.
- Playwright smoke: command completed successfully and generated updated artifacts in `frontend/playwright-smoke/`.

## Notes

- Smoke report contains expected backend-offline request failures when API is not running locally; frontend stayed stable and navigable.
