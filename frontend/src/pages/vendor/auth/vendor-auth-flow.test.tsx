import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorLoginPage } from '@/pages/vendor/auth/vendor-login-page'
import { VendorSidebar } from '@/layouts/vendor-sidebar'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('Vendor auth flow', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
  })

  it('logs in vendor and persists session', async () => {
    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/auth/vendor/login' && method === 'POST') {
        return createJsonResponse({
          accessToken: 'vendor-token',
          user: {
            id: 2,
            role: 'vendor',
            fullName: 'Vendor User',
          },
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/vendor/login']}>
          <Routes>
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/vendor/dashboard" element={<div>Vendor Dashboard Target</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'vendor-pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Vendor Dashboard Target')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('atspaces.vendor.session.runtime')).toContain('vendor-token')
  })

  it('logs out vendor and clears session', async () => {
    setVendorSession()

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/auth/vendor/logout' && method === 'POST') {
        return createJsonResponse({ message: 'Logged out' })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/vendor/dashboard']}>
          <Routes>
            <Route path="/vendor/dashboard" element={<VendorSidebar collapsed={false} />} />
            <Route path="/vendor/login" element={<div>Vendor Login Target</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(await screen.findByText('Vendor Login Target')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.sessionStorage.getItem('atspaces.vendor.session.runtime')).toBeNull()
    })
  })
})
