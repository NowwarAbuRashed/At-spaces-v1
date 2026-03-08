# At Spaces Frontend (Admin Portal)

This is the React + Vite admin frontend for At Spaces.

## Requirements

- Node.js 20+
- npm 10+
- Backend API reachable (default: `http://localhost:3000/api`)

## Environment Variables

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_HCAPTCHA_TEST_TOKEN=
VITE_ADMIN_MFA_CODE=
```

Notes:
- `VITE_HCAPTCHA_TEST_TOKEN` is optional and should only be used in non-production testing.
- Do not commit real secrets or real admin codes.

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Build

```bash
npm run build
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run test
```

## Smoke Test (Playwright)

Build and preview first, then run the smoke script:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node ./scripts/playwright-smoke.mjs
```

Optional:

```bash
SMOKE_BASE_URL=http://127.0.0.1:4173 node ./scripts/playwright-smoke.mjs
```

Artifacts are written to `frontend/playwright-smoke/`.
