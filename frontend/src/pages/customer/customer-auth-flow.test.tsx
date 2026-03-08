import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { AppRoutes } from '@/app/routes'
import { CustomerLayout } from '@/layouts/customer-layout'
import { CustomerLoginPage } from '@/pages/customer/customer-login-page'
import {
  createJsonResponse,
  mockFetch,
  setCustomerSession,
  setupBrowserStorageMocks,
} from '@/pages/customer/test-utils'

describe('Customer auth flow', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
  })

  it('redirects protected customer route to login when unauthenticated', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/profile']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Sign in to continue booking')).toBeInTheDocument()
  })

  it('logs in customer and persists session', async () => {
    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/auth/customer/login-email' && method === 'POST') {
        return createJsonResponse({
          accessToken: 'customer-token',
          user: {
            id: 10,
            role: 'customer',
            fullName: 'Customer User',
          },
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/profile' } }]}>
          <Routes>
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/profile" element={<div>Profile Target</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'customer@atspaces.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'secret-pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Profile Target')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('atspaces.customer.session.runtime')).toContain('customer-token')
  })

  it('logs out customer and clears session', async () => {
    setCustomerSession()

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/auth/customer/logout' && method === 'POST') {
        return createJsonResponse({ message: 'Logged out' })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route path="/profile" element={<div>Profile Home</div>} />
            </Route>
            <Route path="/login" element={<div>Customer Login Target</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(await screen.findByText('Customer Login Target')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.sessionStorage.getItem('atspaces.customer.session.runtime')).toBeNull()
    })
  })
})
