import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = path.resolve(process.cwd(), 'playwright-smoke')

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Branches', path: '/branches' },
  { label: 'Vendors', path: '/vendors' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Applications', path: '/applications' },
  { label: 'Settings', path: '/settings' },
  { label: 'Notifications', path: '/notifications' },
]

const report = {
  baseUrl,
  timestamp: new Date().toISOString(),
  desktop: { visited: [], errors: [], pageErrors: [], requestFailures: [] },
  mobile: { visited: [], errors: [], pageErrors: [], requestFailures: [] },
}

const adminSessionPayload = {
  accessToken: 'smoke-test-token',
  user: {
    id: 1,
    role: 'admin',
    fullName: 'Smoke Admin',
  },
}

async function injectAdminSession(context) {
  await context.addInitScript((payload) => {
    window.localStorage.setItem('atspaces.admin.session', JSON.stringify(payload))
    window.sessionStorage.removeItem('atspaces.admin.session.runtime')
  }, adminSessionPayload)
}

function attachCollectors(page, bucket) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      bucket.errors.push(msg.text())
    }
  })

  page.on('pageerror', (err) => {
    bucket.pageErrors.push(String(err))
  })

  page.on('requestfailed', (request) => {
    bucket.requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'failed'}`)
  })

  page.on('response', (response) => {
    if (response.status() >= 400) {
      bucket.requestFailures.push(`${response.status()} ${response.request().method()} ${response.url()}`)
    }
  })
}

async function runOptionalAction(action, bucket) {
  try {
    await action()
  } catch (error) {
    bucket.errors.push(`optional_action_failed: ${String(error)}`)
  }
}

async function waitForPageStable(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(400)
}

async function capturePage(page, name, bucket) {
  await waitForPageStable(page)
  const headingLocator = page.locator('h1, h2, h3, h4, [role="heading"]').first()
  const headingCount = await headingLocator.count()
  const heading =
    headingCount > 0
      ? ((await headingLocator.textContent()) ?? '').trim()
      : `No heading (${new URL(page.url()).pathname})`
  bucket.visited.push({ page: name, url: page.url(), heading })
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true })
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await injectAdminSession(context)
  const page = await context.newPage()
  const bucket = report.desktop
  attachCollectors(page, bucket)

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' })
  await capturePage(page, 'desktop-dashboard', bucket)

  for (const item of navItems.slice(1)) {
    const link = page.getByRole('link', { name: item.label, exact: true })
    await link.click()
    await page.waitForURL((url) => url.pathname === item.path, { timeout: 10000 })

    if (item.label === 'Analytics') {
      const weekTab = page.getByRole('tab', { name: /this week/i })
      if (await weekTab.count()) {
        await runOptionalAction(async () => {
          await weekTab.click({ timeout: 3000 })
        }, bucket)
      }
    }

    if (['Branches', 'Vendors', 'Applications'].includes(item.label)) {
      const input = page.locator('input').first()
      if (await input.count()) {
        await runOptionalAction(async () => {
          await input.fill('test')
          await input.fill('')
        }, bucket)
      }
    }

    if (['Approvals', 'Notifications', 'Settings', 'Pricing'].includes(item.label)) {
      const secondTab = page.getByRole('tab').nth(1)
      if (await secondTab.count()) {
        await runOptionalAction(async () => {
          await secondTab.click({ timeout: 3000 })
        }, bucket)
      }
    }

    await capturePage(page, `desktop-${item.label.toLowerCase()}`, bucket)
  }

  const signOutButton = page.getByRole('button', { name: 'Sign Out', exact: true })
  if (await signOutButton.count()) {
    await signOutButton.click()
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 })
    await capturePage(page, 'desktop-login', bucket)

    const forgotLink = page.getByRole('link', { name: /forgot password/i })
    if (await forgotLink.count()) {
      await forgotLink.click()
      await page.waitForURL((url) => url.pathname === '/forgot-password', { timeout: 10000 })
      await capturePage(page, 'desktop-forgot-password', bucket)
    }
  }

  await context.close()
}

async function runMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await injectAdminSession(context)
  const page = await context.newPage()
  const bucket = report.mobile
  attachCollectors(page, bucket)

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' })
  await capturePage(page, 'mobile-dashboard', bucket)

  const menuBtn = page.getByRole('button', { name: 'Open sidebar' })
  if (await menuBtn.count()) {
    await menuBtn.click()
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(outDir, 'mobile-sidebar-open.png'), fullPage: true })

    const analyticsLink = page.getByRole('link', { name: 'Analytics', exact: true })
    if (await analyticsLink.count()) {
      await analyticsLink.click()
      await page.waitForURL((url) => url.pathname === '/analytics', { timeout: 10000 })
      await capturePage(page, 'mobile-analytics', bucket)
    }
  }

  await context.close()
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  try {
    await runDesktop(browser)
    await runMobile(browser)
  } finally {
    await browser.close()
  }

  for (const bucket of [report.desktop, report.mobile]) {
    bucket.errors = Array.from(new Set(bucket.errors))
    bucket.pageErrors = Array.from(new Set(bucket.pageErrors))
    bucket.requestFailures = Array.from(new Set(bucket.requestFailures))
  }

  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
