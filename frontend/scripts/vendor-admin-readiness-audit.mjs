import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const frontendDir = process.cwd()
const rootDir = path.resolve(frontendDir, '..')
const backendDir = path.join(rootDir, 'backend')
const outDir = path.join(frontendDir, 'playwright-portal-smoke')

const backendOrigin = 'http://127.0.0.1:3000'
const frontendOrigin = 'http://127.0.0.1:5174'
const apiOrigin = `${backendOrigin}/api`

function parseDotEnv(raw) {
  const output = {}
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex < 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    output[key] = value
  }

  return output
}

async function waitForHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120000
  const startedAt = Date.now()
  let lastError = 'not_started'

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.status >= 200 && response.status < 400) {
        return
      }
      lastError = `status_${response.status}`
    } catch (error) {
      lastError = String(error)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timeout waiting for ${url}; last_error=${lastError}`)
}

function toSafeName(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

async function run() {
  const backendEnvRaw = await fs.readFile(path.join(backendDir, '.env'), 'utf8')
  const backendEnv = parseDotEnv(backendEnvRaw)

  const backendRequire = createRequire(path.join(backendDir, 'package.json'))
  const { authenticator } = backendRequire('otplib')

  const vendorEmail = process.env.VENDOR_SMOKE_EMAIL ?? 'phase3-vendor@example.com'
  const vendorPassword = process.env.VENDOR_SMOKE_PASSWORD ?? 'Password123!'
  const adminEmail = process.env.ADMIN_SMOKE_EMAIL ?? backendEnv.ADMIN_SEED_EMAIL ?? 'admin@atspaces.local'
  const adminPassword = process.env.ADMIN_SMOKE_PASSWORD ?? backendEnv.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!'
  const adminTotpSecret =
    process.env.ADMIN_SMOKE_TOTP_SECRET ?? backendEnv.ADMIN_SEED_TOTP_SECRET ?? ''
  const adminCaptchaToken = process.env.ADMIN_SMOKE_CAPTCHA ?? 'readiness-captcha'

  if (!adminTotpSecret) {
    throw new Error('Missing ADMIN_SEED_TOTP_SECRET / ADMIN_SMOKE_TOTP_SECRET for admin MFA flow.')
  }

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  const report = {
    startedAt: new Date().toISOString(),
    environment: {
      backendOrigin,
      frontendOrigin,
      apiOrigin,
      vendorEmail,
      adminEmail,
    },
    flows: [],
    observability: {
      consoleErrors: [],
      pageErrors: [],
      requestFailed: [],
      apiHttpErrors: [],
      refreshCalls: [],
    },
    authIsolation: {
      vendorSawAdminRefresh: false,
      vendorSawCustomerRefresh: false,
      adminSawVendorRefresh: false,
      adminSawCustomerRefresh: false,
    },
    artifacts: {
      outputDir: outDir,
      screenshots: [],
      reportFile: path.join(outDir, 'report.json'),
    },
    endedAt: null,
  }

  let backendProcess = null
  let viteServer = null
  let browser = null
  let context = null
  let page = null
  let activePortal = 'none'

  const runFlow = async (name, fn) => {
    const flow = {
      name,
      status: 'PASS',
      error: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
    }

    try {
      await fn()
    } catch (error) {
      flow.status = 'FAIL'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.endedAt = new Date().toISOString()
    report.flows.push(flow)
  }

  const capture = async (name) => {
    const filePath = path.join(outDir, `${name}.png`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(450)
    await page.screenshot({ path: filePath, fullPage: true })
    report.artifacts.screenshots.push(filePath)
  }

  try {
    backendProcess = spawn('npm', ['run', 'start:prod'], {
      cwd: backendDir,
      env: {
        ...process.env,
        ...backendEnv,
      },
      shell: true,
      stdio: 'ignore',
    })

    await waitForHttp(`${apiOrigin}/health`, { timeoutMs: 150000 })

    viteServer = await createServer({
      root: frontendDir,
      server: {
        host: '127.0.0.1',
        port: 5174,
        strictPort: true,
      },
    })
    await viteServer.listen()
    await waitForHttp(frontendOrigin, { timeoutMs: 120000 })

    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    page = await context.newPage()

    page.on('console', (message) => {
      if (message.type() === 'error') {
        report.observability.consoleErrors.push(message.text())
      }
    })

    page.on('pageerror', (error) => {
      report.observability.pageErrors.push(String(error))
    })

    page.on('requestfailed', (request) => {
      report.observability.requestFailed.push(
        `${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'failed'}`,
      )
    })

    page.on('response', (response) => {
      const url = response.url()
      if (!url.includes('/api/')) {
        return
      }

      const method = response.request().method()
      const status = response.status()
      if (status >= 400) {
        report.observability.apiHttpErrors.push(`${status} ${method} ${url}`)
      }

      if (
        url.includes('/api/auth/customer/refresh') ||
        url.includes('/api/auth/vendor/refresh') ||
        url.includes('/api/admin/auth/refresh')
      ) {
        report.observability.refreshCalls.push({ portal: activePortal, method, status, url })
      }
    })

    const vendorNav = [
      { label: 'Dashboard', path: '/vendor/dashboard' },
      { label: 'Branches', path: '/vendor/branches' },
      { label: 'Services', path: '/vendor/services' },
      { label: 'Availability', path: '/vendor/availability' },
      { label: 'Bookings', path: '/vendor/bookings' },
      { label: 'Requests', path: '/vendor/requests' },
      { label: 'Notifications', path: '/vendor/notifications' },
      { label: 'Settings', path: '/vendor/settings' },
    ]

    activePortal = 'vendor'

    await runFlow('vendor_login', async () => {
      await page.goto(`${frontendOrigin}/vendor/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#vendor-email', vendorEmail)
      await page.fill('#vendor-password', vendorPassword)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/vendor/dashboard', { timeout: 25000 }),
        page.getByRole('button', { name: 'Sign In', exact: true }).click(),
      ])
      await capture('vendor-dashboard')
    })

    for (const item of vendorNav.slice(1)) {
      await runFlow(`vendor_nav_${toSafeName(item.label)}`, async () => {
        await page.getByRole('link', { name: item.label, exact: true }).click()
        await page.waitForURL((url) => new URL(url).pathname === item.path, { timeout: 15000 })
        await capture(`vendor-${toSafeName(item.label)}`)
      })
    }

    await runFlow('vendor_capacity_request_create', async () => {
      await page.goto(`${frontendOrigin}/vendor/requests`, { waitUntil: 'domcontentloaded' })
      const submitButton = page.getByRole('button', { name: /Submit Capacity Request/i })
      if (!(await submitButton.count())) {
        return
      }

      const capacityInput = page.getByPlaceholder('Enter requested capacity')
      if (!(await capacityInput.count())) {
        return
      }

      await capacityInput.fill('5')
      await page.locator('textarea').first().fill('Operational demand increase for next cycle.')

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/vendors/vendor-services/') &&
            response.url().includes('/capacity-request') &&
            response.request().method() === 'POST',
          { timeout: 20000 },
        ),
        submitButton.click(),
      ])
      await capture('vendor-request-submitted')
    })

    await runFlow('vendor_profile_update', async () => {
      await page.goto(`${frontendOrigin}/vendor/settings`, { waitUntil: 'domcontentloaded' })
      const fullNameInput = page.locator('input').nth(0)
      if (!(await fullNameInput.count())) {
        return
      }

      const currentValue = (await fullNameInput.inputValue()).trim() || 'Phase3 Vendor'
      const nextValue = currentValue.endsWith(' QA') ? currentValue : `${currentValue} QA`
      await fullNameInput.fill(nextValue)

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/users/me') && response.request().method() === 'PUT',
          { timeout: 20000 },
        ),
        page.getByRole('button', { name: 'Save Settings', exact: true }).click(),
      ])

      await capture('vendor-settings-updated')
    })

    await runFlow('vendor_logout', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/vendor/login', { timeout: 15000 }),
        page.getByRole('button', { name: 'Sign Out', exact: true }).click(),
      ])
      await capture('vendor-logout')
    })

    const adminNav = [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Analytics', path: '/admin/analytics' },
      { label: 'Branches', path: '/admin/branches' },
      { label: 'Vendors', path: '/admin/vendors' },
      { label: 'Pricing', path: '/admin/pricing' },
      { label: 'Approvals', path: '/admin/approvals' },
      { label: 'Applications', path: '/admin/applications' },
      { label: 'Notifications', path: '/admin/notifications' },
      { label: 'Settings', path: '/admin/settings' },
    ]

    activePortal = 'admin'

    await runFlow('admin_login_mfa', async () => {
      await page.goto(`${frontendOrigin}/admin/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#email', adminEmail)
      await page.fill('#password', adminPassword)
      await page.fill('input[placeholder="Captcha token"]', adminCaptchaToken)

      await Promise.all([
        page.waitForSelector('#totp-code', { timeout: 20000 }),
        page.getByRole('button', { name: 'Sign In', exact: true }).click(),
      ])

      const totpCode = authenticator.generate(adminTotpSecret)
      await page.fill('#totp-code', totpCode)

      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/admin/dashboard', { timeout: 25000 }),
        page.getByRole('button', { name: 'Verify & Sign In', exact: true }).click(),
      ])
      await capture('admin-dashboard')
    })

    for (const item of adminNav.slice(1)) {
      await runFlow(`admin_nav_${toSafeName(item.label)}`, async () => {
        await page.getByRole('link', { name: item.label, exact: true }).click()
        await page.waitForURL((url) => new URL(url).pathname === item.path, { timeout: 15000 })
        await capture(`admin-${toSafeName(item.label)}`)
      })
    }

    await runFlow('admin_vendor_status_action', async () => {
      await page.goto(`${frontendOrigin}/admin/vendors`, { waitUntil: 'domcontentloaded' })
      const actionButton = page.getByRole('button', { name: /Suspend|Activate/i }).first()
      if (!(await actionButton.count())) {
        return
      }

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/admin/vendors/') &&
            response.url().includes('/status') &&
            response.request().method() === 'PATCH',
          { timeout: 20000 },
        ),
        actionButton.click(),
      ])
      await capture('admin-vendor-status-updated')
    })

    await runFlow('admin_pricing_unavailable_state', async () => {
      await page.goto(`${frontendOrigin}/admin/pricing`, { waitUntil: 'domcontentloaded' })
      await page.getByText(/Backend Update API Unavailable/i).first().waitFor({ timeout: 10000 })
    })

    await runFlow('admin_settings_tabs_unavailable_state', async () => {
      await page.goto(`${frontendOrigin}/admin/settings`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('tab', { name: 'Security', exact: true }).click()
      await page.getByText(/Security and notification preference endpoints are not available/i).first().waitFor({
        timeout: 10000,
      })
      await page.getByRole('tab', { name: 'Notifications', exact: true }).click()
      await page.getByText(/Security and notification preference endpoints are not available/i).first().waitFor({
        timeout: 10000,
      })
      await capture('admin-settings-unavailable-state')
    })

    await runFlow('admin_logout', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/admin/login', { timeout: 15000 }),
        page.getByRole('button', { name: 'Sign Out', exact: true }).click(),
      ])
      await capture('admin-logout')
    })
  } finally {
    if (context) {
      await context.close()
    }
    if (browser) {
      await browser.close()
    }
    if (viteServer) {
      await viteServer.close()
    }
    if (backendProcess) {
      backendProcess.kill('SIGTERM')
    }
  }

  report.authIsolation.vendorSawAdminRefresh = report.observability.refreshCalls.some(
    (item) => item.portal === 'vendor' && item.url.includes('/api/admin/auth/refresh'),
  )
  report.authIsolation.vendorSawCustomerRefresh = report.observability.refreshCalls.some(
    (item) => item.portal === 'vendor' && item.url.includes('/api/auth/customer/refresh'),
  )
  report.authIsolation.adminSawVendorRefresh = report.observability.refreshCalls.some(
    (item) => item.portal === 'admin' && item.url.includes('/api/auth/vendor/refresh'),
  )
  report.authIsolation.adminSawCustomerRefresh = report.observability.refreshCalls.some(
    (item) => item.portal === 'admin' && item.url.includes('/api/auth/customer/refresh'),
  )

  report.observability.consoleErrors = Array.from(new Set(report.observability.consoleErrors))
  report.observability.pageErrors = Array.from(new Set(report.observability.pageErrors))
  report.observability.requestFailed = Array.from(new Set(report.observability.requestFailed))
  report.observability.apiHttpErrors = Array.from(new Set(report.observability.apiHttpErrors))
  report.endedAt = new Date().toISOString()

  await fs.writeFile(report.artifacts.reportFile, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
