import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(frontendDir, '..')
const backendDir = path.join(rootDir, 'backend')
const outDir = path.join(frontendDir, 'playwright-readiness')

const backendOrigin = 'http://127.0.0.1:3000'
const frontendOrigin = 'http://127.0.0.1:5173'
const apiOrigin = `${backendOrigin}/api`

function nowIso() {
  return new Date().toISOString()
}

function sanitizeError(error) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  const output = []

  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    output.push(item)
  }

  return output
}

async function waitForHttp(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120000
  const start = Date.now()
  let lastError = 'not_started'

  while (Date.now() - start <= timeoutMs) {
    try {
      const response = await fetch(url)
      const text = await response.text()
      let json = null

      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }

      if (response.status >= 200 && response.status < 400) {
        return {
          status: response.status,
          text,
          json,
        }
      }

      lastError = `status:${response.status}`
    } catch (error) {
      lastError = sanitizeError(error)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timeout waiting for ${url}. last_error=${lastError}`)
}

async function apiRequest(pathname, options = {}) {
  const response = await fetch(`${apiOrigin}${pathname}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return {
    status: response.status,
    ok: response.ok,
    text,
    json,
  }
}

async function startBackendInProcess() {
  const backendRequire = createRequire(path.join(backendDir, 'package.json'))
  const previousCwd = process.cwd()

  process.chdir(backendDir)

  try {
    const { ValidationPipe } = backendRequire('@nestjs/common')
    const { ConfigService } = backendRequire('@nestjs/config')
    const { NestFactory } = backendRequire('@nestjs/core')
    const { DocumentBuilder, SwaggerModule } = backendRequire('@nestjs/swagger')

    const cookieParserModule = backendRequire('cookie-parser')
    const cookieParser = cookieParserModule.default ?? cookieParserModule

    const { AppModule } = backendRequire('./dist/src/app.module.js')
    const {
      parseBoolean,
      parseCorsOrigins,
      parseTrustProxy,
    } = backendRequire('./dist/src/common/config/runtime-config.util.js')
    const { StandardExceptionFilter } = backendRequire('./dist/src/common/filters/standard-exception.filter.js')
    const { AppLogger } = backendRequire('./dist/src/common/logging/app-logger.service.js')

    const app = await NestFactory.create(AppModule, { bufferLogs: true })
    const configService = app.get(ConfigService)
    const appLogger = app.get(AppLogger)
    app.useLogger(appLogger)

    const nodeEnv = configService.get('NODE_ENV') ?? 'development'
    const isProduction = nodeEnv === 'production'
    const trustProxy = parseTrustProxy(configService.get('TRUST_PROXY'))
    if (trustProxy !== undefined) {
      app.getHttpAdapter().getInstance().set('trust proxy', trustProxy)
    }

    const allowedOrigins = parseCorsOrigins(configService.get('CORS_ALLOWED_ORIGINS'))
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true)
          return
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        if (!isProduction && allowedOrigins.length === 0) {
          callback(null, true)
          return
        }

        callback(new Error('Origin not allowed by CORS'))
      },
      credentials: parseBoolean(configService.get('CORS_ALLOW_CREDENTIALS'), true),
    })

    app.setGlobalPrefix('api')
    app.enableShutdownHooks()
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    app.useGlobalFilters(new StandardExceptionFilter(isProduction))

    const swaggerEnabled = parseBoolean(configService.get('ENABLE_SWAGGER'), !isProduction)
    if (swaggerEnabled) {
      const swaggerPath = configService.get('SWAGGER_PATH') ?? 'api/docs'
      const swaggerConfig = new DocumentBuilder()
        .setTitle('At Spaces API')
        .setDescription('At Spaces backend API documentation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build()
      const document = SwaggerModule.createDocument(app, swaggerConfig)
      SwaggerModule.setup(swaggerPath, app, document, {
        swaggerOptions: { persistAuthorization: true },
      })
    }

    const host = configService.get('HOST') ?? '0.0.0.0'
    const port = Number(configService.get('PORT') ?? 3000)
    await app.listen(port, host)

    process.chdir(previousCwd)

    return {
      app,
      meta: {
        nodeEnv,
        host,
        port,
        swaggerEnabled,
      },
    }
  } catch (error) {
    process.chdir(previousCwd)
    throw error
  }
}

async function run() {
  const report = {
    startedAt: nowIso(),
    environment: {
      backendOrigin,
      frontendOrigin,
      apiOrigin,
    },
    startup: {
      backend: { started: false, health: null, meta: null, errors: [] },
      frontend: { started: false, probe: null, errors: [] },
    },
    pagesTested: [],
    flowResults: [],
    authChecks: {
      protectedRedirectBeforeLogin: false,
      loginSessionPersisted: false,
      logoutClearsSession: false,
      protectedRedirectAfterLogout: false,
      refreshRequestCount: 0,
      repeated401Detected: false,
    },
    dataChecks: {
      services: null,
      branches: null,
      branchDetails: null,
      myBookingsAfterCreate: null,
      bookingAfterCancel: null,
      calendarExportBodyPrefix: null,
    },
    observability: {
      consoleErrors: [],
      pageErrors: [],
      requestFailed: [],
      httpErrors: [],
      unauthorizedResponses: [],
      vendorAuthCalls: [],
      customerRefreshCalls: [],
      layoutBreakages: [],
    },
    createdUser: null,
    createdBooking: null,
    artifacts: {
      outputDir: outDir,
      screenshots: [],
      calendarFile: null,
      reportFile: path.join(outDir, 'report.json'),
    },
    endedAt: null,
  }

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  let backend = null
  let viteServer = null
  let browser = null
  let context = null
  let page = null

  async function capturePage(name) {
    const fileName = `${name}.png`
    const filePath = path.join(outDir, fileName)

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    const heading = await page
      .locator('h1, h2, [role="heading"]')
      .first()
      .textContent()
      .catch(() => null)

    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    })

    if (overflowX) {
      report.observability.layoutBreakages.push({
        page: name,
        url: page.url(),
        issue: 'horizontal_overflow_detected',
      })
    }

    await page.screenshot({ path: filePath, fullPage: true })

    report.artifacts.screenshots.push(filePath)
    report.pagesTested.push({
      page: name,
      url: page.url(),
      heading: heading ? heading.trim() : '',
      screenshot: filePath,
    })
  }

  async function runFlow(name, fn) {
    const item = {
      name,
      status: 'PASS',
      error: null,
      startedAt: nowIso(),
      endedAt: null,
    }

    try {
      await fn()
    } catch (error) {
      item.status = 'FAIL'
      item.error = sanitizeError(error)
    }

    item.endedAt = nowIso()
    report.flowResults.push(item)
    return item.status === 'PASS'
  }

  try {
    backend = await startBackendInProcess()

    const health = await waitForHttp(`${apiOrigin}/health`, { timeoutMs: 120000 })
    report.startup.backend.started = true
    report.startup.backend.health = health
    report.startup.backend.meta = backend.meta

    if (!health.json || health.json.status !== 'ok') {
      throw new Error(`Unexpected /api/health payload: ${health.text}`)
    }

    viteServer = await createServer({
      root: frontendDir,
      server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
      },
    })

    await viteServer.listen()

    const frontendProbe = await waitForHttp(frontendOrigin, { timeoutMs: 120000 })
    report.startup.frontend.started = true
    report.startup.frontend.probe = {
      status: frontendProbe.status,
      bodyLength: frontendProbe.text.length,
    }

    const servicesProbe = await apiRequest('/services')
    const branchesProbe = await apiRequest('/branches?page=1&limit=20')

    report.dataChecks.services = {
      status: servicesProbe.status,
      itemCount: Array.isArray(servicesProbe.json) ? servicesProbe.json.length : 0,
      sample: Array.isArray(servicesProbe.json) ? servicesProbe.json[0] : null,
    }

    report.dataChecks.branches = {
      status: branchesProbe.status,
      itemCount: branchesProbe.json?.items?.length ?? 0,
      total: branchesProbe.json?.total ?? null,
      sample: branchesProbe.json?.items?.[0] ?? null,
    }

    const firstBranchId = branchesProbe.json?.items?.[0]?.id
    if (typeof firstBranchId === 'number') {
      const branchDetailsProbe = await apiRequest(`/branches/${firstBranchId}`)
      report.dataChecks.branchDetails = {
        status: branchDetailsProbe.status,
        branchId: firstBranchId,
        serviceCount: branchDetailsProbe.json?.services?.length ?? 0,
        facilityCount: branchDetailsProbe.json?.facilities?.length ?? 0,
      }
    }

    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    })
    page = await context.newPage()

    page.on('console', (message) => {
      if (message.type() === 'error') {
        report.observability.consoleErrors.push({
          text: message.text(),
          location: message.location(),
        })
      }
    })

    page.on('pageerror', (error) => {
      report.observability.pageErrors.push(String(error))
    })

    page.on('requestfailed', (request) => {
      report.observability.requestFailed.push({
        method: request.method(),
        url: request.url(),
        errorText: request.failure()?.errorText ?? 'request_failed',
      })
    })

    page.on('response', (response) => {
      const url = response.url()
      if (!url.includes('/api/')) {
        return
      }

      const method = response.request().method()
      const status = response.status()

      if (url.includes('/api/auth/vendor')) {
        report.observability.vendorAuthCalls.push({ method, url, status })
      }

      if (url.includes('/api/auth/customer/refresh')) {
        report.observability.customerRefreshCalls.push({ method, url, status })
      }

      if (status >= 400) {
        report.observability.httpErrors.push({ method, url, status })
      }

      if (status === 401) {
        report.observability.unauthorizedResponses.push({ method, url, status })
      }
    })

    const email = `qa.audit.${Date.now()}@example.com`
    const password = 'QaReady123!'
    report.createdUser = { email }

    await runFlow('Home page', async () => {
      await page.goto(`${frontendOrigin}/`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Book your ideal space with confidence/i }).waitFor({ timeout: 15000 })
      await capturePage('01-home')
    })

    await runFlow('Protected route redirect (not logged in)', async () => {
      await page.goto(`${frontendOrigin}/my-bookings`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 15000 })
      report.authChecks.protectedRedirectBeforeLogin = true
      await capturePage('02-protected-redirect-before-login')
    })

    await runFlow('Registration', async () => {
      await page.goto(`${frontendOrigin}/register`, { waitUntil: 'domcontentloaded' })
      await page.fill('#customer-register-full-name', 'QA Readiness User')
      await page.fill('#customer-register-email', email)
      await page.fill('#customer-register-password', password)
      await page.fill('#customer-register-confirm-password', password)

      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 20000 }),
        page.getByRole('button', { name: /Create account/i }).click(),
      ])

      await capturePage('03-registration-success')
    })

    let accessToken = null
    let createdBookingId = null
    let createdBookingNumber = null

    await runFlow('Login', async () => {
      await page.fill('#customer-login-email', email)
      await page.fill('#customer-login-password', password)

      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 20000 }),
        page.getByRole('button', { name: /^Sign in$/i }).click(),
      ])

      const sessionRaw = await page.evaluate(() => window.sessionStorage.getItem('atspaces.customer.session.runtime'))
      if (!sessionRaw) {
        throw new Error('Customer session runtime key not found after login')
      }

      const parsed = JSON.parse(sessionRaw)
      accessToken = parsed.accessToken

      if (!accessToken) {
        throw new Error('Access token missing from session runtime payload')
      }

      report.authChecks.loginSessionPersisted = true
      await capturePage('04-login-success-home')
    })

    await runFlow('Branch browsing', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/branches', { timeout: 15000 }),
        page.getByRole('link', { name: /^Branches$/i }).click(),
      ])

      const detailsButtons = page.getByRole('button', { name: /View details/i })
      await detailsButtons.first().waitFor({ timeout: 15000 })
      const detailsCount = await detailsButtons.count()
      if (detailsCount < 1) {
        throw new Error('No branch cards available for browsing')
      }

      await capturePage('05-branches')
    })

    await runFlow('Branch details', async () => {
      await page.getByRole('button', { name: /View details/i }).first().click()
      await page.waitForURL((url) => new URL(url).pathname.startsWith('/branches/'), { timeout: 15000 })
      await capturePage('06-branch-details')
    })

    await runFlow('Booking preview', async () => {
      const previewButton = page.getByRole('button', { name: /Go to booking preview|Continue to booking preview/i }).first()
      await previewButton.click()
      await page.waitForURL((url) => new URL(url).pathname === '/booking-preview', { timeout: 15000 })

      await page.locator('input[type="date"]').first().fill('2026-04-10')
      await page.locator('input[type="time"]').nth(0).fill('08:00')
      await page.locator('input[type="time"]').nth(1).fill('09:00')
      await page.locator('input[type="number"]').first().fill('1')
      await page.waitForTimeout(1000)

      await capturePage('07-booking-preview')
    })

    await runFlow('Create booking', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/my-bookings', { timeout: 20000 }),
        page.getByRole('button', { name: /^Create booking$/i }).click(),
      ])

      if (!accessToken) {
        throw new Error('Missing access token while validating booking creation')
      }

      const myBookings = await apiRequest('/bookings/my?page=1&limit=20', {
        accessToken,
      })

      if (!myBookings.ok || !Array.isArray(myBookings.json?.items) || myBookings.json.items.length < 1) {
        throw new Error(`Unexpected /bookings/my response after creation: status=${myBookings.status}`)
      }

      const latest = myBookings.json.items[0]
      createdBookingId = latest.id
      createdBookingNumber = latest.bookingNumber

      report.createdBooking = {
        id: createdBookingId,
        bookingNumber: createdBookingNumber,
      }
      report.dataChecks.myBookingsAfterCreate = {
        status: myBookings.status,
        itemCount: myBookings.json.items.length,
        firstItem: latest,
      }

      await capturePage('08-my-bookings-after-create')
    })

    await runFlow('Calendar export', async () => {
      const calendarButton = page.getByRole('button', { name: /Add to Calendar|Exported/i }).first()
      if (await calendarButton.isDisabled()) {
        throw new Error('Calendar export button is disabled unexpectedly')
      }

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        calendarButton.click(),
      ])

      const calendarPath = path.join(outDir, 'booking.ics')
      await download.saveAs(calendarPath)
      report.artifacts.calendarFile = calendarPath

      if (!accessToken || typeof createdBookingId !== 'number') {
        throw new Error('Missing auth or booking id for calendar verification')
      }

      const calendarResponse = await apiRequest(`/bookings/${createdBookingId}/calendar.ics`, {
        accessToken,
      })

      report.dataChecks.calendarExportBodyPrefix = {
        status: calendarResponse.status,
        prefix: calendarResponse.text.slice(0, 24),
      }

      if (!calendarResponse.ok || !calendarResponse.text.startsWith('BEGIN:VCALENDAR')) {
        throw new Error('Calendar export API did not return valid ICS content')
      }

      await capturePage('09-calendar-export')
    })

    await runFlow('Cancel booking', async () => {
      await page.getByRole('button', { name: /^Cancel Booking$/i }).first().click()
      if (!createdBookingId) {
        throw new Error('Missing created booking id for cancellation flow')
      }

      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes(`/api/bookings/${createdBookingId}/cancel`) &&
            response.request().method() === 'POST' &&
            response.status() === 200,
          { timeout: 20000 },
        ),
        page.getByRole('button', { name: /^Confirm cancel$/i }).click(),
      ])

      await page.getByText(/Cancelled/i).first().waitFor({ timeout: 15000 })
      await page.waitForTimeout(500)

      if (!accessToken || typeof createdBookingId !== 'number') {
        throw new Error('Missing auth or booking id for cancellation verification')
      }

      const bookingDetails = await apiRequest(`/bookings/${createdBookingId}`, {
        accessToken,
      })

      report.dataChecks.bookingAfterCancel = {
        status: bookingDetails.status,
        payload: bookingDetails.json,
      }

      if (!bookingDetails.ok || bookingDetails.json?.status !== 'cancelled') {
        throw new Error('Booking status was not cancelled after cancellation flow')
      }

      await capturePage('10-booking-cancelled')
    })

    await runFlow('Profile page', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/profile', { timeout: 15000 }),
        page.getByRole('link', { name: /^Profile$/i }).first().click(),
      ])

      await page.getByRole('heading', { name: /Manage your customer profile and preferences/i }).waitFor({ timeout: 15000 })
      await capturePage('11-profile')
    })

    await runFlow('Logout', async () => {
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 15000 }),
        page.getByRole('button', { name: /^Logout$/i }).first().click(),
      ])

      const sessionRaw = await page.evaluate(() => window.sessionStorage.getItem('atspaces.customer.session.runtime'))
      if (sessionRaw !== null) {
        throw new Error('Session runtime key still exists after logout')
      }

      report.authChecks.logoutClearsSession = true
      await capturePage('12-after-logout')
    })

    await runFlow('Protected route redirect (after logout)', async () => {
      await page.goto(`${frontendOrigin}/my-bookings`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL((url) => new URL(url).pathname === '/login', { timeout: 15000 })
      report.authChecks.protectedRedirectAfterLogout = true
      await capturePage('13-protected-redirect-after-logout')
    })

    report.authChecks.refreshRequestCount = report.observability.customerRefreshCalls.length

    const unauthorizedByUrl = new Map()
    for (const item of report.observability.unauthorizedResponses) {
      const key = `${item.method} ${item.url}`
      unauthorizedByUrl.set(key, (unauthorizedByUrl.get(key) ?? 0) + 1)
    }

    report.authChecks.repeated401Detected = Array.from(unauthorizedByUrl.values()).some((count) => count > 2)
  } finally {
    try {
      if (context) {
        await context.close()
      }
    } catch {
      // no-op
    }

    try {
      if (browser) {
        await browser.close()
      }
    } catch {
      // no-op
    }

    try {
      if (viteServer) {
        await viteServer.close()
      }
    } catch {
      // no-op
    }

    try {
      if (backend?.app) {
        await backend.app.close()
      }
    } catch {
      // no-op
    }

    report.observability.consoleErrors = uniqueBy(
      report.observability.consoleErrors,
      (item) => `${item.text}|${item.location?.url}|${item.location?.lineNumber}`,
    )
    report.observability.pageErrors = uniqueBy(report.observability.pageErrors, (item) => item)
    report.observability.requestFailed = uniqueBy(
      report.observability.requestFailed,
      (item) => `${item.method}|${item.url}|${item.errorText}`,
    )
    report.observability.httpErrors = uniqueBy(
      report.observability.httpErrors,
      (item) => `${item.status}|${item.method}|${item.url}`,
    )
    report.observability.unauthorizedResponses = uniqueBy(
      report.observability.unauthorizedResponses,
      (item) => `${item.status}|${item.method}|${item.url}`,
    )
    report.observability.vendorAuthCalls = uniqueBy(
      report.observability.vendorAuthCalls,
      (item) => `${item.status}|${item.method}|${item.url}`,
    )
    report.observability.customerRefreshCalls = uniqueBy(
      report.observability.customerRefreshCalls,
      (item) => `${item.status}|${item.method}|${item.url}`,
    )
    report.observability.layoutBreakages = uniqueBy(
      report.observability.layoutBreakages,
      (item) => `${item.page}|${item.url}|${item.issue}`,
    )

    report.endedAt = nowIso()
    await fs.writeFile(report.artifacts.reportFile, JSON.stringify(report, null, 2), 'utf8')
  }

  return report
}

run()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2))
  })
  .catch((error) => {
    console.error(`AUDIT_FAILED: ${sanitizeError(error)}`)
    process.exit(1)
  })
