# API Usage And Frontend Connection Matrix

Generated on: 2026-03-08

## Meaning
- `Yes (live verified)`: confirmed by latest readiness runs.
- `Yes (frontend wired)`: connected in frontend API clients, but not directly proven in latest readiness run.
- `No`: in OpenAPI spec but not connected in current frontend API clients.

## Totals
- Total APIs in OpenAPI: **64**
- Currently in use (live verified): **11**
- Currently in use (frontend wired): **41**
- Not currently in use: **12**
- Connected from frontend: **51**

## Full Table (64 APIs)
| API Name | Belongs To | Currently In Use | Practical Use | Connected From Frontend | Frontend Source |
|---|---|---|---|---|---|
| GET /admin/analytics | Admin | Yes (frontend wired) | Analytics overview (aggregated) | Yes | admin-api.ts::fetchAdminAnalytics |
| GET /admin/approval-requests | Admin | Yes (frontend wired) | List approval requests | Yes | admin-api.ts::listApprovalRequests |
| GET /admin/approval-requests/{id} | Admin | No | Approval request details (includes integrity hash) | No | - |
| POST /admin/approval-requests/{id}/approve | Admin | Yes (frontend wired) | Approve request | Yes | admin-api.ts::approveRequest |
| POST /admin/approval-requests/{id}/reject | Admin | Yes (frontend wired) | Reject request (reason required) | Yes | admin-api.ts::rejectRequest |
| GET /admin/audit-log | Admin | Yes (frontend wired) | Audit log (paged) | Yes | admin-api.ts::listAuditLog |
| POST /admin/auth/forgot-password | Auth - Admin | Yes (frontend wired) | Admin forgot password | Yes | auth-api.ts::adminForgotPasswordRequest |
| POST /admin/auth/login | Auth - Admin | Yes (frontend wired) | Admin login step 1 (password + captcha) | Yes | auth-api.ts::adminLoginRequest |
| POST /admin/auth/logout | Auth - Admin | Yes (frontend wired) | Admin logout | Yes | auth-api.ts::adminLogoutRequest |
| POST /admin/auth/mfa/verify | Auth - Admin | Yes (frontend wired) | Admin MFA verify step 2 (TOTP) | Yes | auth-api.ts::adminVerifyMfaRequest |
| POST /admin/auth/refresh | Auth - Admin | Yes (frontend wired) | Admin refresh access token | Yes | auth-api.ts::adminRefreshRequest |
| POST /admin/auth/reset-password | Auth - Admin | No | Admin reset password (requires TOTP) | No | - |
| GET /admin/branches | Admin | Yes (frontend wired) | List branches | Yes | admin-api.ts::listAdminBranches |
| PATCH /admin/branches/{id}/status | Admin | Yes (frontend wired) | Update branch status (audit logged) | Yes | admin-api.ts::updateAdminBranchStatus |
| POST /admin/reports/export | Admin | Yes (frontend wired) | Export report (S3 presigned URL) | Yes | admin-api.ts::exportAdminReport |
| GET /admin/vendors | Admin | Yes (frontend wired) | List vendors | Yes | admin-api.ts::listAdminVendors |
| PATCH /admin/vendors/{id}/status | Admin | Yes (live verified) | Update vendor status | Yes | admin-api.ts::updateAdminVendorStatus |
| POST /ai/recommend | AI | Yes (frontend wired) | AI branch recommendation (optional) | Yes | customer-api.ts::customerRecommendRequest |
| POST /auth/customer/forgot-password | Auth - Customer | Yes (frontend wired) | Customer forgot password | Yes | customer-api.ts::customerForgotPasswordRequest |
| POST /auth/customer/login-email | Auth - Customer | Yes (frontend wired) | Customer login (email/password) | Yes | customer-api.ts::customerLoginRequest |
| POST /auth/customer/logout | Auth - Customer | Yes (frontend wired) | Logout (revoke refresh + clear cookie) | Yes | customer-api.ts::customerLogoutRequest |
| POST /auth/customer/refresh | Auth - Customer | Yes (frontend wired) | Refresh access token (uses refresh cookie) | Yes | customer-api.ts::customerRefreshRequest |
| POST /auth/customer/register-email | Auth - Customer | Yes (frontend wired) | Register customer with email | Yes | customer-api.ts::customerRegisterEmailRequest |
| POST /auth/customer/register-phone | Auth - Customer | No | Register customer with phone (OTP) | No | - |
| POST /auth/customer/resend-otp | Auth - Customer | No | Resend OTP to phone | No | - |
| POST /auth/customer/reset-password | Auth - Customer | No | Customer reset password | No | - |
| POST /auth/customer/verify-otp | Auth - Customer | No | Verify OTP for customer | No | - |
| POST /auth/vendor/forgot-password | Auth - Vendor | Yes (frontend wired) | Vendor forgot password | Yes | vendor-api.ts::vendorForgotPasswordRequest |
| POST /auth/vendor/login | Auth - Vendor | Yes (frontend wired) | Vendor login (email/password) | Yes | vendor-api.ts::vendorLoginRequest |
| POST /auth/vendor/logout | Auth - Vendor | Yes (frontend wired) | Vendor logout | Yes | vendor-api.ts::vendorLogoutRequest |
| POST /auth/vendor/refresh | Auth - Vendor | Yes (frontend wired) | Vendor refresh access token | Yes | vendor-api.ts::vendorRefreshRequest |
| POST /auth/vendor/reset-password | Auth - Vendor | No | Vendor reset password | No | - |
| POST /availability/check | Availability | Yes (frontend wired) | Check availability + price | Yes | customer-api.ts::customerCheckAvailabilityRequest |
| POST /bookings | Bookings | Yes (frontend wired) | Create booking | Yes | customer-api.ts::customerCreateBookingRequest |
| GET /bookings/{id} | Bookings | Yes (live verified) | Booking details (ownership required) | Yes | customer-api.ts::getCustomerBookingDetailsRequest |
| GET /bookings/{id}/calendar.ics | Bookings | Yes (live verified) | Export booking to calendar (ICS) | Yes | customer-api.ts::exportCustomerBookingCalendarRequest |
| POST /bookings/{id}/cancel | Bookings | Yes (live verified) | Cancel booking | Yes | customer-api.ts::cancelCustomerBookingRequest |
| GET /bookings/my | Bookings | Yes (live verified) | List my bookings | Yes | customer-api.ts::listCustomerMyBookingsRequest |
| POST /bookings/preview | Bookings | Yes (frontend wired) | Preview booking price (no booking created) | Yes | customer-api.ts::customerBookingPreviewRequest |
| GET /branches | Branches | Yes (live verified) | List branches (filters + pagination) | Yes | customer-api.ts::listCustomerBranchesRequest |
| GET /branches/{id} | Branches | Yes (live verified) | Branch details (facilities + services) | Yes | customer-api.ts::getCustomerBranchDetailsRequest |
| GET /branches/search | Branches | Yes (frontend wired) | Search branches by query string | Yes | customer-api.ts::searchCustomerBranchesRequest |
| GET /facilities | Branches | Yes (frontend wired) | Facilities catalog (public) | Yes | customer-api.ts::listCustomerFacilitiesRequest |
| GET /features | Branches | No | Features catalog (public) | No | - |
| GET /health | System | Yes (live verified) | Health check | No | - |
| GET /notifications | Notifications | Yes (frontend wired) | List notifications | Yes | notifications-api.ts::listNotifications |
| PATCH /notifications/{id}/read | Notifications | Yes (frontend wired) | Mark notification as read | Yes | notifications-api.ts::markNotificationRead |
| GET /services | Services | Yes (live verified) | List services | Yes | customer-api.ts::listCustomerServicesRequest |
| GET /services/{id} | Services | No | Get service details | No | - |
| POST /uploads/image | Uploads | No | Upload image (vendor/admin) | No | - |
| GET /users/me | Users | Yes (frontend wired) | Get my profile | Yes | customer-api.ts::getCustomerProfileRequest, users-api.ts::getMe |
| PUT /users/me | Users | Yes (live verified) | Update my profile | Yes | customer-api.ts::updateCustomerProfileRequest, users-api.ts::updateMe |
| PUT /vendors/availability | Vendors | Yes (frontend wired) | Upsert availability slots | Yes | vendor-api.ts::upsertVendorAvailability |
| GET /vendors/bookings | Vendors | Yes (frontend wired) | Vendor bookings list | Yes | vendor-api.ts::listVendorBookings |
| PATCH /vendors/bookings/{id}/status | Vendors | Yes (frontend wired) | Update booking status (vendor only) | Yes | vendor-api.ts::updateVendorBookingStatus |
| PUT /vendors/branches/{id} | Vendors | Yes (frontend wired) | Update vendor branch info | Yes | vendor-api.ts::updateVendorBranch |
| GET /vendors/branches/me | Vendors | Yes (frontend wired) | Vendor branches (owned) | Yes | vendor-api.ts::listVendorBranches |
| GET /vendors/dashboard | Vendors | Yes (frontend wired) | Vendor dashboard overview | Yes | vendor-api.ts::getVendorDashboard |
| POST /vendors/register | Vendors | No | Vendor registration (requires admin approval) | No | - |
| GET /vendors/vendor-services | Vendors | Yes (frontend wired) | List vendor services | Yes | vendor-api.ts::listVendorServices |
| GET /vendors/vendor-services/{id} | Vendors | Yes (frontend wired) | Vendor service details | Yes | vendor-api.ts::getVendorService |
| POST /vendors/vendor-services/{id}/capacity-request | Vendors | Yes (live verified) | Create capacity change request (approval) | Yes | vendor-api.ts::createVendorCapacityRequest |
| PUT /vendors/vendor-services/{id}/price | Vendors | Yes (frontend wired) | Update vendor service price | Yes | vendor-api.ts::updateVendorServicePrice |
| GET /version | System | No | API version | No | - |

