import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorSettingsPage } from '@/pages/vendor/vendor-settings-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorSettingsPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('loads vendor profile and updates profile fields through backend API', async () => {
    let updatePayload: unknown = null

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/users/me' && method === 'GET') {
        return createJsonResponse({
          id: 2,
          fullName: 'Maya Al-Masri',
          email: 'maya@vendor.com',
          phoneNumber: '+962700000000',
          role: 'vendor',
        })
      }

      if (url.pathname === '/api/users/me' && method === 'PUT') {
        updatePayload = init?.body ? JSON.parse(String(init.body)) : null
        return createJsonResponse({
          id: 2,
          fullName: 'Maya Updated',
          email: 'maya@vendor.com',
          phoneNumber: '+962700000000',
          role: 'vendor',
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorSettingsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByDisplayValue('Maya Al-Masri')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Maya Al-Masri'), { target: { value: 'Maya Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }))

    await waitFor(() => {
      expect(updatePayload).toEqual({
        fullName: 'Maya Updated',
        email: 'maya@vendor.com',
      })
    })

    expect(screen.getByRole('switch', { name: 'SMS Alerts' })).toBeDisabled()
  })
})
