# README-API.md — At Spaces API Contract (v2)
This is the **API contract** Antigrafte must implement using **NestJS + Prisma + PostgreSQL + Redis**.

## Roles (ONLY)
- `customer`
- `vendor`
- `admin`

## Auth model (Access + Refresh)
- **Access token**: returned in JSON (short-lived, e.g., 10–15 min)
- **Refresh token**: stored in **HttpOnly + Secure + SameSite=Strict** cookie (rotated + revocable)
- Admin login requires **MFA (TOTP)** + protections (rate limit, lockout, hCaptcha) per `README-SECURITY_FINAL_v3.md`.

---

## 0) Base URL, Conventions, Status Codes

### Base URL
- Local: `http://localhost:3000/api`
- Prod:  `https://<domain>/api`

### Headers
- `Content-Type: application/json`
- Authenticated requests: `Authorization: Bearer <accessToken>`

### Refresh cookie
- `Set-Cookie: atspaces_rt=...; HttpOnly; Secure; SameSite=Strict; Path=/api;`
- Never return refresh token in JSON.

### Date/time formats
- Date-time: ISO 8601, e.g. `2026-03-05T10:30:00Z`
- Date: `YYYY-MM-DD`, e.g. `2026-03-05`
- Time: `HH:mm`, e.g. `10:30`

### Pagination
Query: `?page=1&limit=20`
Response:
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "hasNext": false
}
```

### Standard error format
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human readable message",
  "details": [{ "field": "startTime", "issue": "startTime must be before endTime" }]
}
```

### Status codes
- 200 OK, 201 Created, 202 Accepted
- 400 Bad request, 401 Unauthenticated, 403 Unauthorized, 404 Not found
- 422 Validation error, 429 Rate limited

---

## 1) System / Meta (NEW)
### 1.1 Health
`GET /health`
```json
{ "status": "ok" }
```

### 1.2 Version
`GET /version`
```json
{ "version": "1.0.0" }
```

---

## 2) Authentication & Users

### 2.1 Customer register (email)
`POST /auth/customer/register-email`
```json
{ "fullName": "string", "email": "string", "password": "string" }
```
201:
```json
{ "userId": 123, "message": "Account created" }
```

### 2.2 Customer register (phone → OTP)
`POST /auth/customer/register-phone`
```json
{ "fullName": "string", "phoneNumber": "+9627xxxxxxxx" }
```
202:
```json
{ "message": "OTP sent" }
```

### 2.3 Customer verify OTP (signup/login)
`POST /auth/customer/verify-otp`
```json
{ "phoneNumber": "+9627xxxxxxxx", "otpCode": "123456", "purpose": "signup" }
```
200:
```json
{ "accessToken": "jwt", "user": { "id": 123, "role": "customer", "fullName": "..." } }
```
> Refresh cookie is set.

### 2.4 Customer login (email)
`POST /auth/customer/login-email`
```json
{ "email": "user@example.com", "password": "secret" }
```
200:
```json
{ "accessToken": "jwt", "user": { "id": 123, "role": "customer", "fullName": "..." } }
```

### 2.5 Customer resend OTP
`POST /auth/customer/resend-otp`
```json
{ "phoneNumber": "+9627xxxxxxxx", "purpose": "login" }
```
200:
```json
{ "message": "OTP resent" }
```

### 2.6 Customer refresh / logout
- `POST /auth/customer/refresh` (uses cookie) → `{ "accessToken": "new_jwt" }`
- `POST /auth/customer/logout` → `{ "message": "Logged out" }` (revoke + clear cookie)

---

### 2.7 Vendor register (requires admin approval)
`POST /vendors/register`
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "branch": { "name": "string", "city": "string", "address": "string", "latitude": 31.95, "longitude": 35.91 }
}
```
202:
```json
{ "message": "Vendor registration submitted for approval" }
```

### 2.8 Vendor login / refresh / logout
- `POST /auth/vendor/login`
- `POST /auth/vendor/refresh`
- `POST /auth/vendor/logout`

Same shapes as customer email login.

---

### 2.9 Admin login (Step 1: password + captcha)
`POST /admin/auth/login`
```json
{ "email": "admin@example.com", "password": "secret", "captchaToken": "hcaptcha_token" }
```
200:
```json
{ "preAuthToken": "jwt_pre_auth", "mfaRequired": true }
```

### 2.10 Admin MFA verify (Step 2: TOTP)
`POST /admin/auth/mfa/verify`
```json
{ "preAuthToken": "jwt_pre_auth", "totpCode": "123456" }
```
200:
```json
{ "accessToken": "jwt", "user": { "id": 1, "role": "admin", "fullName": "Admin" } }
```
> Refresh cookie is set.

### 2.11 Admin refresh / logout
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`

---

### 2.12 Password recovery (NEW)
> Customer/Vendor/Admin can have email-based reset. Admin reset requires step-up MFA at completion.

#### Forgot password
- `POST /auth/customer/forgot-password`
- `POST /auth/vendor/forgot-password`
- `POST /admin/auth/forgot-password`
```json
{ "email": "user@example.com" }
```
200:
```json
{ "message": "If the email exists, reset instructions were sent." }
```

#### Reset password
- `POST /auth/customer/reset-password`
- `POST /auth/vendor/reset-password`
```json
{ "resetToken": "string", "newPassword": "string" }
```
200:
```json
{ "message": "Password updated" }
```

#### Admin reset password (Step-up MFA)
`POST /admin/auth/reset-password`
```json
{ "resetToken": "string", "newPassword": "string", "totpCode": "123456" }
```
200:
```json
{ "message": "Password updated" }
```

---

### 2.13 User profile (me)
`GET /users/me` (auth required)
`PUT /users/me`
```json
{ "fullName": "string", "email": "string?" }
```

---

## 3) Public Browsing (Guest/Customer)

### 3.1 Services list + details (NEW detail)
- `GET /services`
- `GET /services/:id` (NEW)

### 3.2 Branches list + search (NEW search)
- `GET /branches?city=Amman&serviceId=1&page=1&limit=20`
- `GET /branches/search?q=abdali&page=1&limit=20` (NEW)

### 3.3 Branch details (includes facilities + services)
`GET /branches/:id`

### 3.4 Catalogs
- `GET /facilities`
- `GET /features`

---

## 4) Availability & Booking (Customer)

### 4.1 Check availability + price
`POST /availability/check`
```json
{ "vendorServiceId": 55, "startTime": "2026-03-05T10:00:00Z", "endTime": "2026-03-05T12:00:00Z", "quantity": 2 }
```
200:
```json
{ "available": true, "price": 20.0 }
```

### 4.2 Booking price preview (NEW)
`POST /bookings/preview`
```json
{ "vendorServiceId": 55, "startTime": "2026-03-05T10:00:00Z", "endTime": "2026-03-05T12:00:00Z", "quantity": 2 }
```
200:
```json
{ "totalPrice": 20.0, "currency": "JOD" }
```

### 4.3 Create booking
`POST /bookings` (customer auth)
```json
{ "vendorServiceId": 55, "startTime": "2026-03-05T10:00:00Z", "endTime": "2026-03-05T12:00:00Z", "quantity": 2, "paymentMethod": "cash" }
```
201:
```json
{ "bookingId": 900, "bookingNumber": "BKG-20260305-0001", "totalPrice": 20.0, "status": "pending", "paymentStatus": "pending" }
```

### 4.4 My bookings + booking details (NEW detail)
- `GET /bookings/my?page=1&limit=20`
- `GET /bookings/:id` (NEW, customer ownership required)

### 4.5 Cancel booking
`POST /bookings/:id/cancel`

### 4.6 Calendar export (ICS)
`GET /bookings/:id/calendar.ics`  
- Must enforce: booking.customerId == req.user.id  
- Returns `text/calendar`

---

## 5) Vendor APIs (Vendor Auth)

### 5.1 Vendor dashboard
`GET /vendors/dashboard`

### 5.2 Vendor branch management (NEW)
- `GET /vendors/branches/me`
- `PUT /vendors/branches/:id`
```json
{ "name": "string", "description": "string?", "city": "string", "address": "string", "latitude": 31.95, "longitude": 35.91 }
```

### 5.3 Vendor services list + details (NEW detail)
- `GET /vendors/vendor-services?branchId=10&page=1&limit=20`
- `GET /vendors/vendor-services/:id` (NEW)

### 5.4 Update pricing
`PUT /vendors/vendor-services/:id/price`
```json
{ "pricePerUnit": 25.0, "priceUnit": "day" }
```

### 5.5 Capacity request (approval + integrity)
`POST /vendors/vendor-services/:id/capacity-request`
```json
{ "newCapacity": 80, "reason": "We added more seats" }
```
202:
```json
{ "requestId": 3001, "status": "pending" }
```

### 5.6 Availability management
`PUT /vendors/availability`
```json
{ "vendorServiceId": 55, "date": "2026-03-05", "slots": [{ "start": "10:00", "end": "12:00", "availableUnits": 20 }] }
```

### 5.7 Vendor bookings + status update
- `GET /vendors/bookings?date=2026-03-05&page=1&limit=50`
- `PATCH /vendors/bookings/:id/status`
```json
{ "status": "completed" }
```
Allowed: `completed`, `no_show`

### 5.8 Facilities/features management
- `PUT /vendors/branches/:id/facilities`
- `PUT /vendors/vendor-services/:id/features`

---

## 6) Admin APIs (Admin Auth)

### 6.1 Approval requests
- `GET /admin/approval-requests?status=pending&page=1&limit=20`
- `GET /admin/approval-requests/:id` (returns recomputed HMAC)
- `POST /admin/approval-requests/:id/approve`
- `POST /admin/approval-requests/:id/reject` (reason min 10)
```json
{ "reason": "Not enough justification provided" }
```

### 6.2 Branch management
- `GET /admin/branches?page=1&limit=20`
- `PATCH /admin/branches/:id/status`
```json
{ "status": "active" }
```

### 6.3 Vendor management
- `GET /admin/vendors?page=1&limit=20`
- `PATCH /admin/vendors/:id/status`
```json
{ "status": "suspended" }
```

### 6.4 Analytics (aggregated)
`GET /admin/analytics?from=2026-03-01&to=2026-03-05`

### 6.5 Reports export (S3 presigned)
`POST /admin/reports/export`
```json
{ "reportType": "revenue", "format": "csv", "filters": { "from": "2026-03-01", "to": "2026-03-05" } }
```
200:
```json
{ "url": "https://s3-presigned-url", "expiresIn": 300 }
```

### 6.6 Audit log
`GET /admin/audit-log?from=2026-03-01&to=2026-03-05&page=1&limit=50`

---

## 7) Notifications (NEW)
> Needed for: approvals, booking confirmations, vendor/admin alerts.

### 7.1 List notifications
`GET /notifications?page=1&limit=20` (auth required)

### 7.2 Mark as read
`PATCH /notifications/:id/read`

---

## 8) Uploads (NEW)
> For branch/service images. Store in S3 (private/public as policy), return URL.

### 8.1 Upload image
`POST /uploads/image` (auth: vendor/admin)
- Content-Type: `multipart/form-data`
- field: `file`

200:
```json
{ "url": "https://cdn-or-s3-url", "key": "s3/object/key" }
```

---

## 9) AI (Optional / Later)
`POST /ai/recommend`
If not implemented yet: return `501 Not Implemented` or a safe deterministic stub.

---

## 10) Definition of Done (for Antigrafte)
For every endpoint group:
1) DTO validation (`class-validator`) + correct status codes
2) Auth guards per role (`customer/vendor/admin`)
3) Prisma queries are safe + indexes used where needed
4) Audit/security_events logging where required by security README
5) Swagger decorators for request/response schemas
6) Jest/Supertest tests for:
   - admin login protections (rate limit/lockout/captcha)
   - booking validation (quantity >=1, start<end)
   - calendar export IDOR prevention
   - reject reason min length
