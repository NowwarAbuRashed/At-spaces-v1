# AtSpaces Login Credentials (Dev)

Checked on: **March 8, 2026**

## Customer Portal
- URL: `http://localhost:5173/login`
- Email: `phase3-customer-1@example.com`
- Password: `Password123!`

## Vendor Portal
- URL: `http://localhost:5173/vendor/login`
- Email: `phase3-vendor@example.com`
- Password: `Password123!`

## Admin Portal
- URL: `http://localhost:5173/admin/login`
- Email: `admin@atspaces.local`
- Password: `ChangeMe123!`
- Captcha Token field: use `readiness-captcha`

### Admin MFA (required)
- TOTP Secret (dev): `JBSWY3DPEHPK3PXP`
- Generate current OTP code with:

```bash
node -e "const { authenticator } = require('./backend/node_modules/otplib'); console.log(authenticator.generate('JBSWY3DPEHPK3PXP'))"
```

## If customer login fails
- Register a new customer at: `http://localhost:5173/register`
