# API Done And Using

Generated on: 2026-03-08

## Data Sources
- `openapi-atspaces.yaml`
- `frontend/playwright-readiness/report.json`
- `frontend/playwright-portal-smoke/report.json`
- `frontend/scripts/customer-readiness-audit.mjs`
- `frontend/scripts/vendor-admin-readiness-audit.mjs`

## Summary
- OpenAPI total operations: **64**
- OpenAPI unique paths: **63**
- Readiness verified operations: **11**
- Security monitored operations: **3**
- Not verified by readiness yet: **50**
- Customer readiness flows: **13/13 PASS**
- Vendor/Admin readiness flows: **24/24 PASS**

## Status Legend
- `Done`: directly validated by latest readiness audits.
- `Monitored`: tracked for auth/session isolation in latest readiness audits.
- `Not verified`: present in OpenAPI spec but not directly validated by these two readiness scripts.

## Full API Inventory (All Operations)
| Path | Method | Tag | Using | Status | Details |
|---|---|---|---|---|---|
| /admin/analytics | GET | Admin | Spec only | Not verified | Analytics overview (aggregated) |
| /admin/approval-requests | GET | Admin | Spec only | Not verified | List approval requests |
| /admin/approval-requests/{id} | GET | Admin | Spec only | Not verified | Approval request details (includes integrity hash) |
| /admin/approval-requests/{id}/approve | POST | Admin | Spec only | Not verified | Approve request |
| /admin/approval-requests/{id}/reject | POST | Admin | Spec only | Not verified | Reject request (reason required) |
| /admin/audit-log | GET | Admin | Spec only | Not verified | Audit log (paged) |
| /admin/auth/forgot-password | POST | Auth - Admin | Spec only | Not verified | Admin forgot password |
| /admin/auth/login | POST | Auth - Admin | Spec only | Not verified | Admin login step 1 (password + captcha) |
| /admin/auth/logout | POST | Auth - Admin | Spec only | Not verified | Admin logout |
| /admin/auth/mfa/verify | POST | Auth - Admin | Spec only | Not verified | Admin MFA verify step 2 (TOTP) |
| /admin/auth/refresh | POST | Auth - Admin | Yes | Monitored | Monitored for auth isolation; no cross-portal refresh leakage observed. |
| /admin/auth/reset-password | POST | Auth - Admin | Spec only | Not verified | Admin reset password (requires TOTP) |
| /admin/branches | GET | Admin | Spec only | Not verified | List branches |
| /admin/branches/{id}/status | PATCH | Admin | Spec only | Not verified | Update branch status (audit logged) |
| /admin/reports/export | POST | Admin | Spec only | Not verified | Export report (S3 presigned URL) |
| /admin/vendors | GET | Admin | Spec only | Not verified | List vendors |
| /admin/vendors/{id}/status | PATCH | Admin | Yes | Done | Admin vendor status action flow passed. |
| /ai/recommend | POST | AI | Spec only | Not verified | AI branch recommendation (optional) |
| /auth/customer/forgot-password | POST | Auth - Customer | Spec only | Not verified | Customer forgot password |
| /auth/customer/login-email | POST | Auth - Customer | Spec only | Not verified | Customer login (email/password) |
| /auth/customer/logout | POST | Auth - Customer | Spec only | Not verified | Logout (revoke refresh + clear cookie) |
| /auth/customer/refresh | POST | Auth - Customer | Yes | Monitored | Monitored for auth isolation; no cross-portal refresh leakage observed. |
| /auth/customer/register-email | POST | Auth - Customer | Spec only | Not verified | Register customer with email |
| /auth/customer/register-phone | POST | Auth - Customer | Spec only | Not verified | Register customer with phone (OTP) |
| /auth/customer/resend-otp | POST | Auth - Customer | Spec only | Not verified | Resend OTP to phone |
| /auth/customer/reset-password | POST | Auth - Customer | Spec only | Not verified | Customer reset password |
| /auth/customer/verify-otp | POST | Auth - Customer | Spec only | Not verified | Verify OTP for customer |
| /auth/vendor/forgot-password | POST | Auth - Vendor | Spec only | Not verified | Vendor forgot password |
| /auth/vendor/login | POST | Auth - Vendor | Spec only | Not verified | Vendor login (email/password) |
| /auth/vendor/logout | POST | Auth - Vendor | Spec only | Not verified | Vendor logout |
| /auth/vendor/refresh | POST | Auth - Vendor | Yes | Monitored | Monitored for auth isolation; no cross-portal refresh leakage observed. |
| /auth/vendor/reset-password | POST | Auth - Vendor | Spec only | Not verified | Vendor reset password |
| /availability/check | POST | Availability | Spec only | Not verified | Check availability + price |
| /bookings | POST | Bookings | Spec only | Not verified | Create booking |
| /bookings/{id} | GET | Bookings | Yes | Done | Used after cancellation to confirm status=cancelled. |
| /bookings/{id}/calendar.ics | GET | Bookings | Yes | Done | Calendar export API returned valid ICS body. |
| /bookings/{id}/cancel | POST | Bookings | Yes | Done | Cancellation flow awaited successful 200 response. |
| /bookings/my | GET | Bookings | Yes | Done | Used to validate created booking appears in list. |
| /bookings/preview | POST | Bookings | Spec only | Not verified | Preview booking price (no booking created) |
| /branches | GET | Branches | Yes | Done | Customer readiness list probe succeeded (200). |
| /branches/{id} | GET | Branches | Yes | Done | Customer readiness branch details probe succeeded (200). |
| /branches/search | GET | Branches | Spec only | Not verified | Search branches by query string |
| /facilities | GET | Branches | Spec only | Not verified | Facilities catalog (public) |
| /features | GET | Branches | Spec only | Not verified | Features catalog (public) |
| /health | GET | System | Yes | Done | Readiness startup health check returned 200 and {"status":"ok"}. |
| /notifications | GET | Notifications | Spec only | Not verified | List notifications |
| /notifications/{id}/read | PATCH | Notifications | Spec only | Not verified | Mark notification as read |
| /services | GET | Services | Yes | Done | Customer readiness probe succeeded (200). |
| /services/{id} | GET | Services | Spec only | Not verified | Get service details |
| /uploads/image | POST | Uploads | Spec only | Not verified | Upload image (vendor/admin) |
| /users/me | GET | Users | Spec only | Not verified | Get my profile |
| /users/me | PUT | Users | Yes | Done | Vendor profile update flow passed. |
| /vendors/availability | PUT | Vendors | Spec only | Not verified | Upsert availability slots |
| /vendors/bookings | GET | Vendors | Spec only | Not verified | Vendor bookings list |
| /vendors/bookings/{id}/status | PATCH | Vendors | Spec only | Not verified | Update booking status (vendor only) |
| /vendors/branches/{id} | PUT | Vendors | Spec only | Not verified | Update vendor branch info |
| /vendors/branches/me | GET | Vendors | Spec only | Not verified | Vendor branches (owned) |
| /vendors/dashboard | GET | Vendors | Spec only | Not verified | Vendor dashboard overview |
| /vendors/register | POST | Vendors | Spec only | Not verified | Vendor registration (requires admin approval) |
| /vendors/vendor-services | GET | Vendors | Spec only | Not verified | List vendor services |
| /vendors/vendor-services/{id} | GET | Vendors | Spec only | Not verified | Vendor service details |
| /vendors/vendor-services/{id}/capacity-request | POST | Vendors | Yes | Done | Vendor capacity request flow passed. |
| /vendors/vendor-services/{id}/price | PUT | Vendors | Spec only | Not verified | Update vendor service price |
| /version | GET | System | Spec only | Not verified | API version |

## Known Issues In Latest Run
- `GET http://localhost:3000/api/vendors/vendor-services?page=1&limit=50 :: net::ERR_ABORTED`
- `GET http://localhost:3000/api/admin/vendors?page=1&limit=100 :: net::ERR_ABORTED`

