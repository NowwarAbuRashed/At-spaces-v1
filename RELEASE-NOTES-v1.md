# Release Notes v1

Date: 2026-03-08

## Release Summary

v1 finalizes backend-integrated customer frontend delivery and resolves the remaining auth/session noise blockers discovered in live smoke tests.

## Customer Frontend: Finalized Scope

- Public routes delivered:
  - `/`
  - `/login`
  - `/register`
  - `/branches`
  - `/branches/:id`
  - `/booking-preview`
- Protected routes delivered:
  - `/my-bookings`
  - `/profile`
- Live backend flows verified:
  - customer register/login
  - branches list/details
  - booking preview
  - booking create
  - my bookings list
  - booking cancel
  - booking calendar export
  - profile load/update

## Auth/Session Blocker Fixes (Final)

### 1) Customer refresh gating

File:
- `frontend/src/features/customer-auth/store/customer-auth-context.tsx`

Change:
- Refresh is now attempted only when a real persisted customer session was restored.
- Guest/fresh app boot no longer triggers unnecessary customer refresh calls.

Result:
- Removed repeated customer refresh 401 noise on customer boot.

### 2) Vendor refresh isolation from customer app

File:
- `frontend/src/features/auth/store/vendor-auth-context.tsx`

Change:
- Added route-scope gating (`/vendor` only) before vendor refresh logic runs.
- Added persisted-session gating to avoid refresh attempts without vendor session state.

Result:
- Customer app no longer triggers vendor refresh requests.

### 3) Console/network cleanup

Result in live run:
- no failed backend API requests
- no console errors
- no runtime crashes
- no request-failure noise from refresh loops

## Validation

Frontend checks:
- `npm run typecheck` passed
- `npm run lint` passed
- `npm run test` passed (`36/36` files, `59/59` tests)
- `npm run build` passed

Live walkthrough/smoke artifacts:
- `frontend/playwright-smoke/customer-auth-noise-live-report.json`
- `frontend/playwright-smoke/quick-website-walkthrough-report.json`

## Final Status

READY
