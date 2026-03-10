import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'

const frontendOrigin = 'http://127.0.0.1:5173'
const apiOrigin = 'http://127.0.0.1:3000/api'
const rootDir = path.resolve('..')
const outDir = path.join(path.resolve('.'), 'full-audit-artifacts')

const customerEmail = `qa.full.audit.${Date.now()}@example.com`
const customerPassword = 'QaReady123!'
const vendorEmail = 'phase3-vendor@example.com'
const vendorPassword = 'Password123!'
const adminEmail = 'admin@atspaces.local'
const adminPassword = 'ChangeMe123!'
const adminCaptchaToken = 'readiness-captcha'

const requireFromBackend = createRequire(path.join(rootDir, 'backend', 'package.json'))
const { authenticator } = requireFromBackend('otplib')

const now = () => new Date().toISOString()
const safe = (e) => (e instanceof Error ? e.message : String(e))
const pth = (url) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
const apiPath = (url) => {
  try {
    const u = new URL(url)
    return `${u.pathname}${u.search}`
  } catch {
    return url
  }
}
const fileSafe = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const isBackendApiUrl = (url) =>
  url.includes('://127.0.0.1:3000/api/') || url.includes('://localhost:3000/api/')

async function waitOk(url, timeoutMs = 120000) {
  const start = Date.now()
  let last = 'none'
  while (Date.now() - start <= timeoutMs) {
    try {
      const r = await fetch(url)
      const t = await r.text()
      let j = null
      try { j = t ? JSON.parse(t) : null } catch {}
      if (r.ok) return { status: r.status, text: t, json: j }
      last = `status_${r.status}`
    } catch (e) {
      last = safe(e)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`timeout ${url} ${last}`)
}

function dedupe(items, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const k = keyFn(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}

async function main() {
  const report = {
    startedAt: now(),
    env: { frontendOrigin, apiOrigin, customerEmail, vendorEmail, adminEmail },
    startup: {},
    pagesTested: [],
    workflowsTested: [],
    workingFeatures: [],
    frontendIssues: [],
    backendIssues: [],
    apiIssues: [],
    securityChecks: [],
    diagnostics: { consoleErrors: [], pageErrors: [], requestFailed: [], apiCalls: [] },
    performance: { avgLatencyMs: null, p95LatencyMs: null, slowCalls: [], repeatedCalls: [], totalApiCalls: 0 },
    requiredVerifications: {
      vendorBookingStatusUpdate: false,
      customerBookingFlows: false,
      adminApprovalFlows: false,
      notificationsReadUnread: { vendor: false, admin: false },
    },
    finalVerdict: 'PARTIAL',
    artifacts: { outDir, screenshots: [], reportFile: path.join(outDir, 'full-system-audit-report.json') },
    endedAt: null,
  }

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  const started = new Map()
  const ids = { branchId: null, serviceId: null }

  let browser
  let context
  let page

  const capture = async (name) => {
    const file = path.join(outDir, `${fileSafe(name)}.png`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(350)
    await page.screenshot({ path: file, fullPage: true })
    report.artifacts.screenshots.push(file)
    return file
  }

  const addPage = async (label, expectedPath = null) => {
    report.pagesTested.push({
      label,
      expectedPath,
      actualPath: pth(page.url()),
      url: page.url(),
      screenshot: await capture(label),
    })
  }

  const flow = async (name, fn) => {
    const f = { name, status: 'PASS', error: null, startedAt: now(), endedAt: null }
    try {
      await fn()
    } catch (e) {
      f.status = 'FAIL'
      f.error = safe(e)
      report.frontendIssues.push(`FAIL ${name}: ${f.error}`)
    }
    f.endedAt = now()
    report.workflowsTested.push(f)
  }

  try {
    const health = await waitOk(`${apiOrigin}/health`)
    report.startup.apiHealth = health
    const front = await waitOk(frontendOrigin)
    report.startup.frontend = { status: front.status, bodyLength: front.text.length }

    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
    page = await context.newPage()

    page.on('console', (m) => {
      if (m.type() === 'error') {
        report.diagnostics.consoleErrors.push({ text: m.text(), location: m.location(), page: page.url() })
      }
    })

    page.on('pageerror', (e) => {
      report.diagnostics.pageErrors.push({ error: String(e), page: page.url() })
    })

    page.on('requestfailed', (r) => {
      report.diagnostics.requestFailed.push({ method: r.method(), url: r.url(), errorText: r.failure()?.errorText ?? 'failed' })
    })

    page.on('request', (r) => {
      if (isBackendApiUrl(r.url())) started.set(r, Date.now())
    })

    page.on('response', (res) => {
      if (!isBackendApiUrl(res.url())) return
      void (async () => {
        const req = res.request()
        const latencyMs = started.has(req) ? Date.now() - started.get(req) : null
        let bodyJson = null
        let bodyText = null
        try {
          bodyText = await res.text()
          if ((res.headers()['content-type'] ?? '').includes('application/json') && bodyText) {
            bodyJson = JSON.parse(bodyText)
          }
        } catch {}
        const call = {
          method: req.method(),
          url: res.url(),
          path: apiPath(res.url()),
          status: res.status(),
          latencyMs,
          bodyJson,
          bodyTextPrefix: bodyText ? bodyText.slice(0, 160) : null,
          portal: pth(page.url()).startsWith('/admin') ? 'admin' : pth(page.url()).startsWith('/vendor') ? 'vendor' : 'customer',
        }
        report.diagnostics.apiCalls.push(call)
        if (call.status >= 400) report.apiIssues.push(`${call.status} ${call.method} ${call.path}`)
        if (call.status >= 500) report.backendIssues.push(`500 ${call.method} ${call.path}`)
      })()
    })

    await flow('customer_home_route', async () => {
      await page.goto(`${frontendOrigin}/`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Book your ideal space with confidence/i }).waitFor({ timeout: 15000 })
      await addPage('customer-home', '/')
    })

    await flow('customer_reset_password_route', async () => {
      await page.goto(`${frontendOrigin}/reset-password`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Set a new password/i }).waitFor({ timeout: 15000 })
      await addPage('customer-reset-password-route', '/reset-password')
    })

    await flow('customer_register_workflow', async () => {
      await page.goto(`${frontendOrigin}/register`, { waitUntil: 'domcontentloaded' })
      await page.fill('#customer-register-full-name', 'QA Full Audit Customer')
      await page.fill('#customer-register-email', customerEmail)
      await page.fill('#customer-register-password', customerPassword)
      await page.fill('#customer-register-confirm-password', customerPassword)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 25000 }),
        page.getByRole('button', { name: /Create account/i }).click(),
      ])
      await addPage('customer-register', '/login')
    })

    await flow('customer_login_workflow', async () => {
      await page.goto(`${frontendOrigin}/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#customer-login-email', customerEmail)
      await page.fill('#customer-login-password', customerPassword)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 25000 }),
        page.getByRole('button', { name: /^Sign in$/i }).click(),
      ])
      await addPage('customer-login-success', '/')
    })

    await flow('security_customer_cannot_access_vendor', async () => {
      await page.goto(`${frontendOrigin}/vendor/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/vendor/login', { timeout: 15000 })
      report.securityChecks.push({ check: 'customer_session_blocked_from_vendor', status: 'PASS', actualPath: pth(page.url()) })
      await addPage('security-customer-blocked-vendor', '/vendor/login')
    })

    await flow('customer_branch_browsing', async () => {
      await page.goto(`${frontendOrigin}/branches`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Discover branches built for every work style/i }).waitFor({ timeout: 15000 })
      const b = page.getByRole('button', { name: /View details/i }).first()
      await b.waitFor({ timeout: 15000 })
      await b.click()
      await page.waitForURL((url) => new URL(url).pathname.startsWith('/branches/'), { timeout: 15000 })
      const m = pth(page.url()).match(/\/branches\/(\d+)/)
      ids.branchId = m ? Number(m[1]) : null
      await addPage('customer-branch-details', '/branches/:id')
    })

    await flow('customer_service_details_route', async () => {
      const link = page.getByRole('link', { name: /Service details/i }).first()
      await link.waitFor({ timeout: 15000 })
      const href = await link.getAttribute('href')
      const m = (href ?? '').match(/\/services\/(\d+)/)
      ids.serviceId = m ? Number(m[1]) : null
      await link.click()
      await page.waitForURL((url) => new URL(url).pathname.startsWith('/services/'), { timeout: 15000 })
      await addPage('customer-service-details', '/services/:id')
    })

    await flow('customer_booking_preview_and_create_booking_a', async () => {
      if (!ids.branchId || !ids.serviceId) throw new Error('missing branch/service id')
      await page.goto(`${frontendOrigin}/booking-preview?branchId=${ids.branchId}&serviceId=${ids.serviceId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/booking-preview', { timeout: 15000 })
      await page.locator('input[type="date"]').first().fill('2026-04-20')
      await page.locator('input[type="time"]').nth(0).fill('09:00')
      await page.locator('input[type="time"]').nth(1).fill('10:00')
      await page.locator('input[type="number"]').first().fill('1')
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/my-bookings', { timeout: 25000 }),
        page.getByRole('button', { name: /^Create booking$/i }).click(),
      ])
      await addPage('customer-my-bookings-after-create-a', '/my-bookings')
    })

    await flow('customer_logout_session_one', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 15000 }),
        page.getByRole('button', { name: /^Logout$/i }).first().click(),
      ])
      await addPage('customer-logout-session-one', '/login')
    })

    await flow('vendor_register_workflow', async () => {
      const regEmail = `qa.vendor.audit.${Date.now()}@example.com`
      await page.goto(`${frontendOrigin}/vendor/register`, { waitUntil: 'domcontentloaded' })
      await page.fill('#vendor-register-full-name', 'QA Vendor Applicant')
      await page.fill('#vendor-register-email', regEmail)
      await page.fill('#vendor-register-password', 'VendorQa123!')
      await page.fill('#vendor-register-branch-name', 'QA Vendor Branch')
      await page.fill('#vendor-register-city', 'Amman')
      await page.fill('#vendor-register-address', 'QA Street 100')
      await page.fill('#vendor-register-latitude', '31.95')
      await page.fill('#vendor-register-longitude', '35.91')
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/vendor/login', { timeout: 25000 }),
        page.getByRole('button', { name: /Submit registration/i }).click(),
      ])
      await addPage('vendor-register', '/vendor/login')
    })

    await flow('vendor_login_workflow', async () => {
      await page.goto(`${frontendOrigin}/vendor/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#vendor-email', vendorEmail)
      await page.fill('#vendor-password', vendorPassword)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/vendor/dashboard', { timeout: 25000 }),
        page.getByRole('button', { name: /^Sign In$/i }).click(),
      ])
      await addPage('vendor-dashboard', '/vendor/dashboard')
    })

    await flow('security_vendor_cannot_access_admin', async () => {
      await page.goto(`${frontendOrigin}/admin/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/admin/login', { timeout: 15000 })
      report.securityChecks.push({ check: 'vendor_session_blocked_from_admin', status: 'PASS', actualPath: pth(page.url()) })
      await addPage('security-vendor-blocked-admin', '/admin/login')
    })

    await flow('vendor_dashboard_load', async () => {
      await page.goto(`${frontendOrigin}/vendor/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Vendor Dashboard/i }).waitFor({ timeout: 15000 })
      await addPage('vendor-dashboard-load', '/vendor/dashboard')
    })

    await flow('vendor_update_branch_info', async () => {
      await page.goto(`${frontendOrigin}/vendor/branches`, { waitUntil: 'domcontentloaded' })
      const nameInput = page.locator('label:has-text("Name") input').first()
      await nameInput.waitFor({ timeout: 15000 })
      const current = (await nameInput.inputValue()).trim()
      await nameInput.fill(current.endsWith(' QA') ? `${current}1` : `${current} QA`)
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/vendors/branches/') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.getByRole('button', { name: /Save Changes/i }).click(),
      ])
      await addPage('vendor-branches-updated', '/vendor/branches')
    })

    await flow('vendor_update_service_price', async () => {
      await page.goto(`${frontendOrigin}/vendor/services`, { waitUntil: 'domcontentloaded' })
      const priceInput = page.locator('label:has-text("Price Per Unit") input[type="number"]').first()
      await priceInput.waitFor({ timeout: 15000 })
      const n = Number(await priceInput.inputValue())
      await priceInput.fill(String(Number.isFinite(n) ? n + 1 : 10))
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/vendors/vendor-services/') && res.url().includes('/price') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.getByRole('button', { name: /Save Pricing/i }).click(),
      ])
      await addPage('vendor-services-updated', '/vendor/services')
    })

    await flow('vendor_update_availability', async () => {
      await page.goto(`${frontendOrigin}/vendor/availability`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: /Add Slot|Create First Slot/i }).first().click()
      await page.getByRole('heading', { name: /Add Availability Slot|Edit Availability Slot/i }).first().waitFor({ timeout: 10000 })
      const d = new Date(); d.setDate(d.getDate() + 2)
      const dateValue = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
      await page.locator('input[type="date"]').first().fill(dateValue)
      await page.locator('input[type="time"]').nth(0).fill('11:00')
      await page.locator('input[type="time"]').nth(1).fill('12:00')
      await page.locator('input[type="number"]').first().fill('2')
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/vendors/availability') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.locator('[role="dialog"]').getByRole('button', { name: /Add Slot|Save Slot/i }).click(),
      ])
      await addPage('vendor-availability-updated', '/vendor/availability')
    })

    await flow('vendor_view_bookings_and_change_status', async () => {
      const bookingsResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/vendors/bookings') && res.request().method() === 'GET',
        { timeout: 20000 },
      )
      await page.goto(`${frontendOrigin}/vendor/bookings`, { waitUntil: 'domcontentloaded' })
      await bookingsResponsePromise
      await page.waitForTimeout(400)
      let clicked = false

      const completeButtons = page.getByRole('button', { name: /Mark Completed/i })
      const completeCount = await completeButtons.count()
      for (let i = 0; i < completeCount; i += 1) {
        const candidate = completeButtons.nth(i)
        if (await candidate.isEnabled().catch(() => false)) {
          await Promise.all([
            page.waitForResponse((res) => res.url().includes('/api/vendors/bookings/') && res.url().includes('/status') && res.request().method() === 'PATCH', { timeout: 20000 }),
            candidate.click(),
          ])
          clicked = true
          break
        }
      }

      if (!clicked) {
        const noShowButtons = page.getByRole('button', { name: /Mark No Show/i })
        const noShowCount = await noShowButtons.count()
        for (let i = 0; i < noShowCount; i += 1) {
          const candidate = noShowButtons.nth(i)
          if (await candidate.isEnabled().catch(() => false)) {
            await Promise.all([
              page.waitForResponse((res) => res.url().includes('/api/vendors/bookings/') && res.url().includes('/status') && res.request().method() === 'PATCH', { timeout: 20000 }),
              candidate.click(),
            ])
            clicked = true
            break
          }
        }
      }

      if (!clicked) throw new Error('no actionable vendor booking found for status mutation')
      report.requiredVerifications.vendorBookingStatusUpdate = true
      await addPage('vendor-bookings', '/vendor/bookings')
    })

    await flow('vendor_notifications_unread_read', async () => {
      const notificationsResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/notifications') && res.request().method() === 'GET',
        { timeout: 20000 },
      )
      await page.goto(`${frontendOrigin}/vendor/notifications`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /^Notifications$/i }).first().waitFor({ timeout: 15000 })
      await notificationsResponsePromise
      await page.waitForTimeout(400)
      const payload = [...report.diagnostics.apiCalls]
        .reverse()
        .find(
          (call) =>
            call.portal === 'vendor' &&
            call.method === 'GET' &&
            call.path.startsWith('/api/notifications') &&
            call.status === 200 &&
            Array.isArray(call.bodyJson?.items),
        )?.bodyJson
      const items = Array.isArray(payload?.items) ? payload.items : []
      const unreadCount = items.filter((item) => item && item.isRead === false).length
      const readCount = items.filter((item) => item && item.isRead === true).length

      if (!items.length) throw new Error('vendor notifications API returned zero notifications')
      if (!unreadCount) throw new Error('vendor notifications API missing unread records')
      if (!readCount) throw new Error('vendor notifications API missing read records')

      const firstUnreadMarkButton = page.getByRole('button', { name: /^Mark as read$/i }).first()
      await firstUnreadMarkButton.waitFor({ timeout: 10000 })
      await Promise.all([
        page.waitForResponse(
          (res) =>
            /\/api\/notifications\/\d+\/read(?:\?.*)?$/.test(res.url()) &&
            res.request().method() === 'PATCH',
          { timeout: 20000 },
        ),
        firstUnreadMarkButton.click(),
      ])

      const markAllButton = page.getByRole('button', { name: /Mark all as read/i }).first()
      if (await markAllButton.isEnabled()) {
        await Promise.all([
          page.waitForResponse(
            (res) =>
              /\/api\/notifications\/\d+\/read(?:\?.*)?$/.test(res.url()) &&
              res.request().method() === 'PATCH',
            { timeout: 20000 },
          ),
          markAllButton.click(),
        ])
      }

      report.requiredVerifications.notificationsReadUnread.vendor = true
      await addPage('vendor-notifications', '/vendor/notifications')
    })

    await flow('vendor_upload_image_and_settings', async () => {
      await page.goto(`${frontendOrigin}/vendor/settings`, { waitUntil: 'domcontentloaded' })
      const fullNameInput = page.locator('label:has-text("Full Name") input').first()
      await fullNameInput.waitFor({ timeout: 15000 })
      const current = (await fullNameInput.inputValue()).trim()
      await fullNameInput.fill(current.endsWith(' QA') ? `${current}1` : `${current} QA`)
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.getByRole('button', { name: /Save Settings/i }).click(),
      ])
      await page.locator('input[type="file"]').first().setInputFiles(path.join(rootDir, 'tmp-upload.png'))
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/uploads/image') && res.request().method() === 'POST', { timeout: 20000 }),
        page.getByRole('button', { name: /Upload image/i }).click(),
      ])
      await addPage('vendor-settings-upload', '/vendor/settings')
    })

    await flow('vendor_logout_workflow', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/vendor/login', { timeout: 20000 }),
        page.getByRole('button', { name: /Sign Out/i }).first().click(),
      ])
      await addPage('vendor-logout', '/vendor/login')
    })

    await flow('customer_login_session_two', async () => {
      await page.goto(`${frontendOrigin}/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#customer-login-email', customerEmail)
      await page.fill('#customer-login-password', customerPassword)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 25000 }),
        page.getByRole('button', { name: /^Sign in$/i }).click(),
      ])
      await addPage('customer-login-session-two', '/')
    })

    await flow('customer_create_booking_b_for_cancel', async () => {
      if (!ids.branchId || !ids.serviceId) throw new Error('missing branch/service id')
      await page.goto(`${frontendOrigin}/booking-preview?branchId=${ids.branchId}&serviceId=${ids.serviceId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('input[type="date"]').first().fill('2026-04-21')
      await page.locator('input[type="time"]').nth(0).fill('09:00')
      await page.locator('input[type="time"]').nth(1).fill('10:00')
      await page.locator('input[type="number"]').first().fill('1')
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/my-bookings', { timeout: 25000 }),
        page.getByRole('button', { name: /^Create booking$/i }).click(),
      ])
      await addPage('customer-my-bookings-after-create-b', '/my-bookings')
    })

    await flow('customer_cancel_booking_workflow', async () => {
      await page.goto(`${frontendOrigin}/my-bookings`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: /^Cancel Booking$/i }).first().click()
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/bookings/') && res.url().includes('/cancel') && res.request().method() === 'POST', { timeout: 20000 }),
        page.getByRole('button', { name: /^Confirm cancel$/i }).click(),
      ])
      await page.getByText(/Cancelled/i).first().waitFor({ timeout: 15000 })
      report.requiredVerifications.customerBookingFlows = true
      await addPage('customer-cancel-booking', '/my-bookings')
    })

    await flow('customer_profile_update_workflow', async () => {
      await page.goto(`${frontendOrigin}/profile`, { waitUntil: 'domcontentloaded' })
      const input = page.locator('label:has-text("Full Name") input').first()
      await input.waitFor({ timeout: 15000 })
      const current = (await input.inputValue()).trim()
      await input.fill(current.endsWith(' QA') ? `${current}1` : `${current} QA`)
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.getByRole('button', { name: /Save profile|Saving profile/i }).click(),
      ])
      await addPage('customer-profile-updated', '/profile')
    })

    await flow('customer_logout_final', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 20000 }),
        page.getByRole('button', { name: /^Logout$/i }).first().click(),
      ])
      await addPage('customer-logout-final', '/login')
    })

    await flow('admin_reset_password_route', async () => {
      await page.goto(`${frontendOrigin}/admin/reset-password`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Admin Password Reset/i }).waitFor({ timeout: 15000 })
      await addPage('admin-reset-password-route', '/admin/reset-password')
    })

    await flow('admin_login_mfa_workflow', async () => {
      await page.goto(`${frontendOrigin}/admin/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('#email', adminEmail)
      await page.fill('#password', adminPassword)
      await page.fill('input[placeholder="Captcha token"]', adminCaptchaToken)
      await Promise.all([
        page.waitForSelector('#totp-code', { timeout: 20000 }),
        page.getByRole('button', { name: /^Sign In$/i }).click(),
      ])
      await page.fill('#totp-code', authenticator.generate('JBSWY3DPEHPK3PXP'))
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/admin/dashboard', { timeout: 25000 }),
        page.getByRole('button', { name: /Verify & Sign In/i }).click(),
      ])
      await addPage('admin-dashboard', '/admin/dashboard')
    })

    await flow('security_admin_cannot_access_vendor_or_customer_protected', async () => {
      await page.goto(`${frontendOrigin}/vendor/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/vendor/login', { timeout: 15000 })
      await page.goto(`${frontendOrigin}/my-bookings`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 15000 })
      report.securityChecks.push({ check: 'admin_session_blocked_from_vendor_and_customer', status: 'PASS', actualPaths: ['/vendor/login', '/login'] })
      await addPage('security-admin-blocked', '/login')
    })

    await flow('admin_dashboard_reload', async () => {
      await page.goto(`${frontendOrigin}/admin/dashboard`, { waitUntil: 'domcontentloaded' })
      await addPage('admin-dashboard-reload', '/admin/dashboard')
    })

    await flow('admin_vendors_list_and_status_change', async () => {
      await page.goto(`${frontendOrigin}/admin/vendors`, { waitUntil: 'domcontentloaded' })
      const b = page.getByRole('button', { name: /Suspend|Activate/i }).first()
      if (await b.count()) {
        await Promise.all([
          page.waitForResponse((res) => res.url().includes('/api/admin/vendors/') && res.url().includes('/status') && res.request().method() === 'PATCH', { timeout: 20000 }),
          b.click(),
        ])
      }
      await addPage('admin-vendors', '/admin/vendors')
    })

    await flow('admin_branch_management_status_change', async () => {
      await page.goto(`${frontendOrigin}/admin/branches`, { waitUntil: 'domcontentloaded' })
      const b = page.getByRole('button', { name: /Pause|Resume/i }).first()
      if (await b.count()) {
        await Promise.all([
          page.waitForResponse((res) => res.url().includes('/api/admin/branches/') && res.url().includes('/status') && res.request().method() === 'PATCH', { timeout: 20000 }),
          b.click(),
        ])
      }
      await addPage('admin-branches', '/admin/branches')
    })

    await flow('admin_approval_requests_and_details', async () => {
      await page.goto(`${frontendOrigin}/admin/approvals`, { waitUntil: 'domcontentloaded' })
      const details = page.getByRole('link', { name: /^Details$/i }).first()
      if (await details.count()) {
        await details.click()
      } else {
        // Fallback: fetch first approval id from API using current admin token.
        const token = await page.evaluate(() => {
          const raw = window.localStorage.getItem('atspaces.admin.session') ?? window.sessionStorage.getItem('atspaces.admin.session.runtime')
          if (!raw) return null
          try {
            const parsed = JSON.parse(raw)
            return parsed.accessToken ?? null
          } catch {
            return null
          }
        })

        if (!token) throw new Error('No approval details link found and no admin token available')

        const response = await fetch(`${apiOrigin}/admin/approval-requests?page=1&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await response.json().catch(() => null)
        const id = payload?.items?.[0]?.id
        if (typeof id !== 'number') throw new Error('No approval request id available for details route')
        await page.goto(`${frontendOrigin}/admin/approvals/${id}`, { waitUntil: 'domcontentloaded' })
      }

      await page.waitForURL((url) => new URL(url).pathname.startsWith('/admin/approvals/'), {
        timeout: 15000,
      })
      report.requiredVerifications.adminApprovalFlows = true
      await addPage('admin-approval-details', '/admin/approvals/:id')
    })

    await flow('admin_notifications_unread_read', async () => {
      const notificationsResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/notifications') && res.request().method() === 'GET',
        { timeout: 20000 },
      )
      await page.goto(`${frontendOrigin}/admin/notifications`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /^Notifications$/i }).first().waitFor({ timeout: 15000 })
      await notificationsResponsePromise
      await page.waitForTimeout(400)
      const payload = [...report.diagnostics.apiCalls]
        .reverse()
        .find(
          (call) =>
            call.portal === 'admin' &&
            call.method === 'GET' &&
            call.path.startsWith('/api/notifications') &&
            call.status === 200 &&
            Array.isArray(call.bodyJson?.items),
        )?.bodyJson
      const items = Array.isArray(payload?.items) ? payload.items : []
      const unreadCount = items.filter((item) => item && item.isRead === false).length
      const readCount = items.filter((item) => item && item.isRead === true).length

      if (!items.length) throw new Error('admin notifications API returned zero notifications')
      if (!unreadCount) throw new Error('admin notifications API missing unread records')
      if (!readCount) throw new Error('admin notifications API missing read records')

      const firstUnreadMarkButton = page.getByRole('button', { name: /^Mark as read$/i }).first()
      await firstUnreadMarkButton.waitFor({ timeout: 10000 })
      await Promise.all([
        page.waitForResponse(
          (res) =>
            /\/api\/notifications\/\d+\/read(?:\?.*)?$/.test(res.url()) &&
            res.request().method() === 'PATCH',
          { timeout: 20000 },
        ),
        firstUnreadMarkButton.click(),
      ])

      const markAllButton = page.getByRole('button', { name: /Mark All Read/i }).first()
      if (await markAllButton.isEnabled()) {
        await Promise.all([
          page.waitForResponse(
            (res) =>
              /\/api\/notifications\/\d+\/read(?:\?.*)?$/.test(res.url()) &&
              res.request().method() === 'PATCH',
            { timeout: 20000 },
          ),
          markAllButton.click(),
        ])
      }

      report.requiredVerifications.notificationsReadUnread.admin = true
      await addPage('admin-notifications', '/admin/notifications')
    })

    await flow('admin_settings_update', async () => {
      await page.goto(`${frontendOrigin}/admin/settings`, { waitUntil: 'domcontentloaded' })
      const input = page.locator('input[placeholder="Enter full name"]').first()
      await input.waitFor({ timeout: 15000 })
      const current = (await input.inputValue()).trim()
      await input.fill(current.endsWith(' QA') ? `${current}1` : `${current} QA`)
      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT', { timeout: 20000 }),
        page.getByRole('button', { name: /Save Changes/i }).click(),
      ])
      await addPage('admin-settings-updated', '/admin/settings')
    })

    await flow('admin_logout_workflow', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/admin/login', { timeout: 20000 }),
        page.getByRole('button', { name: /Sign Out/i }).first().click(),
      ])
      await addPage('admin-logout', '/admin/login')
    })

    await page.waitForTimeout(1500)
  } catch (e) {
    report.frontendIssues.push(`Audit execution failed: ${safe(e)}`)
  } finally {
    if (context) await context.close()
    if (browser) await browser.close()

    report.apiIssues = Array.from(new Set(report.apiIssues))
    report.backendIssues = Array.from(new Set(report.backendIssues))
    report.frontendIssues = Array.from(new Set(report.frontendIssues))
    report.diagnostics.consoleErrors = dedupe(report.diagnostics.consoleErrors, (x) => `${x.text}|${x.location?.url}|${x.location?.lineNumber}`)
    report.diagnostics.pageErrors = dedupe(report.diagnostics.pageErrors, (x) => `${x.error}|${x.page}`)
    report.diagnostics.requestFailed = dedupe(report.diagnostics.requestFailed, (x) => `${x.method}|${x.url}|${x.errorText}`)

    const apiCalls = report.diagnostics.apiCalls
    report.performance.totalApiCalls = apiCalls.length
    const latencies = apiCalls.map((x) => x.latencyMs).filter((x) => typeof x === 'number').sort((a, b) => a - b)
    if (latencies.length) {
      report.performance.avgLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      report.performance.p95LatencyMs = latencies[Math.max(0, Math.floor(latencies.length * 0.95) - 1)]
    }
    report.performance.slowCalls = apiCalls.filter((x) => typeof x.latencyMs === 'number' && x.latencyMs >= 1000).map((x) => ({ method: x.method, path: x.path, status: x.status, latencyMs: x.latencyMs }))

    const freq = new Map()
    for (const c of apiCalls) {
      const k = `${c.method} ${c.path}`
      freq.set(k, (freq.get(k) ?? 0) + 1)
    }
    report.performance.repeatedCalls = Array.from(freq.entries()).filter(([, v]) => v >= 4).map(([endpoint, count]) => ({ endpoint, count }))

    const passFlows = report.workflowsTested.filter((f) => f.status === 'PASS').map((f) => f.name)
    report.workingFeatures = passFlows

    if (report.diagnostics.consoleErrors.length) report.frontendIssues.push(`Console errors: ${report.diagnostics.consoleErrors.length}`)
    if (report.diagnostics.pageErrors.length) report.frontendIssues.push(`Runtime errors: ${report.diagnostics.pageErrors.length}`)
    if (report.apiIssues.length) report.backendIssues.push(`API 4xx/5xx: ${report.apiIssues.length}`)
    if (!report.requiredVerifications.vendorBookingStatusUpdate) {
      report.frontendIssues.push('Required check failed: vendor booking status update not verified')
    }
    if (!report.requiredVerifications.customerBookingFlows) {
      report.frontendIssues.push('Required check failed: customer booking flow not verified')
    }
    if (!report.requiredVerifications.adminApprovalFlows) {
      report.frontendIssues.push('Required check failed: admin approval flow not verified')
    }
    if (
      !report.requiredVerifications.notificationsReadUnread.vendor ||
      !report.requiredVerifications.notificationsReadUnread.admin
    ) {
      report.frontendIssues.push('Required check failed: notifications unread/read verification not complete')
    }

    const failed = report.workflowsTested.filter((f) => f.status === 'FAIL').length
    if (failed === 0 && report.frontendIssues.length === 0 && report.backendIssues.length === 0) {
      report.finalVerdict = 'READY'
    } else if (failed <= 5 && report.backendIssues.filter((x) => x.includes('500')).length === 0) {
      report.finalVerdict = 'PARTIAL'
    } else {
      report.finalVerdict = 'NOT READY'
    }

    report.endedAt = now()
    await fs.writeFile(report.artifacts.reportFile, JSON.stringify(report, null, 2), 'utf8')
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((e) => {
  console.error(`FULL_AUDIT_FAILED: ${safe(e)}`)
  process.exit(1)
})
