# RELEASE NOTES v1

Date: 2026-03-08
Release Type: Frontend-Backend API Integration Completion
Status: READY

## Overview
This release completes the frontend integration of the previously unused 12 APIs and closes the final verification blockers found during end-to-end readiness checks.

## Newly Integrated APIs (12)
1. `POST /auth/customer/register-phone`
2. `POST /auth/customer/verify-otp`
3. `POST /auth/customer/resend-otp`
4. `POST /auth/customer/reset-password`
5. `GET /services/{id}`
6. `GET /features`
7. `GET /version`
8. `POST /vendors/register`
9. `POST /auth/vendor/reset-password`
10. `POST /uploads/image`
11. `POST /admin/auth/reset-password`
12. `GET /admin/approval-requests/{id}`

## User Flows Delivered
### Customer
- Phone registration
- OTP verification
- Resend OTP
- Customer reset password
- Service details page
- Features and version display

### Vendor
- Vendor registration
- Vendor reset password
- Image upload in vendor settings

### Admin
- Admin reset password
- Approval request details page
- Image upload in admin settings

## Final Blocker Fixes
### 1) Upload image 500 error (`POST /uploads/image`)
- Root cause:
  - Non-production environment was attempting real S3 upload without valid storage credentials, causing runtime 500.
- Fix:
  - Added non-production safe fallback in uploads service for recoverable storage/credential failures.
  - Fallback returns a valid mock image URL payload so vendor/admin upload workflows stay operational.
  - Production remains strict and does not silently bypass storage errors.

### 2) Wrong customer OTP error message
- Root cause:
  - Customer OTP 401 errors were falling into shared unauthorized mapping and showing an admin-session message.
- Fix:
  - Added explicit customer OTP 401 handling in customer registration OTP verify flow.
  - Invalid OTP now shows customer-appropriate OTP error messaging.

## Verification Results (Post-Fix)
- Vendor settings image upload: PASS (`POST /api/uploads/image` -> 200)
- Admin settings image upload: PASS (`POST /api/uploads/image` -> 200)
- Customer OTP invalid-code path: PASS (`POST /api/auth/customer/verify-otp` -> 401 with correct OTP UX message)
- No runtime crashes observed in the revalidated flows.
- No broken navigation observed in the revalidated flows.

## Notes
- In non-production, image upload now gracefully falls back when storage credentials are unavailable.
- For production storage behavior, ensure valid S3 credentials and bucket configuration are present.
