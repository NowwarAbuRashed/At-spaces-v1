# AtSpaces Frontend - Release Notes v1

**Release Date:** 2026-03-08  
**Version:** v1  
**Release Type:** Workflow Completion + Stability Hardening

## 1) Executive Summary
This release completes the production workflow coverage for the three AtSpaces portals (Customer, Vendor, Admin) on top of the existing backend APIs, with strict auth/session isolation, protected routing enforcement, and explicit unavailable states for unsupported backend capabilities.

## 2) Delivered Scope

### Customer Portal
- Routes covered: `/`, `/login`, `/register`, `/forgot-password`, `/branches`, `/branches/:id`, `/booking-preview`, `/my-bookings`, `/profile`.
- Workflow coverage:
  - register, login, session restore behavior
  - browse/search branches and open branch details
  - availability and booking preview
  - create booking, list bookings, cancel booking
  - export booking calendar (ICS)
  - load/update profile
  - logout and post-logout protected redirect

### Vendor Portal
- Routes covered: `/vendor/login`, `/vendor/forgot-password`, `/vendor/dashboard`, `/vendor/branches`, `/vendor/services`, `/vendor/availability`, `/vendor/bookings`, `/vendor/requests`, `/vendor/notifications`, `/vendor/settings`.
- Workflow coverage:
  - vendor login and session restore behavior
  - dashboard and navigation flows
  - branch and service management screens
  - pricing and availability update flows
  - bookings status actions
  - capacity request creation
  - notifications and profile/settings update
  - logout

### Admin Portal
- Routes covered: `/admin/login`, `/admin/dashboard`, `/admin/analytics`, `/admin/branches`, `/admin/vendors`, `/admin/pricing`, `/admin/approvals`, `/admin/applications`, `/admin/notifications`, `/admin/settings`.
- Workflow coverage:
  - admin login with MFA verification path
  - dashboard and analytics load
  - branches/vendors operational actions
  - approvals/applications workflows
  - notifications and settings tabs
  - explicit unavailable state handling where backend capability is not enabled
  - logout

## 3) Security and Session Isolation Fixes
- Customer refresh is gated behind persisted customer session presence to prevent guest boot refresh spam.
- Vendor refresh execution is route-scoped and session-gated to prevent cross-portal leakage from customer/admin routes.
- Admin, vendor, and customer portals operate with isolated refresh behavior and guarded internal routes.
- Repeated 401 loop patterns were removed from normal portal boot flows.

## 4) UX and Reliability Enhancements
- Added/verified loading, empty, and error states on integrated pages.
- Mutation actions use disabled-submit behavior and user feedback via toasts.
- Unsupported backend operations now render explicit unavailable/disabled states; no fake persistence or fake success messages.
- Layout stability preserved across desktop/mobile without route redesign.

## 5) Verification Snapshot
- Frontend quality gates: typecheck, lint, tests, build -> **PASS** (latest validation cycle).
- Customer end-to-end readiness walkthrough -> **PASS** (`frontend/playwright-readiness/report.json`).
- Vendor/Admin portal smoke walkthrough -> **PASS** (`frontend/playwright-portal-smoke/report.json`).
- Auth isolation checks in portal smoke report:
  - `vendorSawAdminRefresh: false`
  - `vendorSawCustomerRefresh: false`
  - `adminSawVendorRefresh: false`
  - `adminSawCustomerRefresh: false`

## 6) Known Non-Blocking Notes
- During rapid route transitions in smoke runs, isolated `net::ERR_ABORTED` navigation-cancelled requests were observed.
- These were not backend functional failures and did not affect completed PASS flows.

## 7) Release Status
**READY FOR HANDOFF / STAGING**
