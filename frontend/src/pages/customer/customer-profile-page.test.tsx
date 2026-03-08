import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { CustomerProfilePage } from '@/pages/customer/customer-profile-page'
import {
  createJsonResponse,
  mockFetch,
  setCustomerSession,
  setupBrowserStorageMocks,
} from '@/pages/customer/test-utils'

describe('CustomerProfilePage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setCustomerSession()
  })

  it('loads profile and updates supported fields through backend', async () => {
    let updatePayload: unknown = null

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/users/me' && method === 'GET') {
        return createJsonResponse({
          id: 100,
          fullName: 'Customer User',
          email: 'customer@atspaces.com',
          phoneNumber: '+966555111222',
          role: 'customer',
        })
      }

      if (url.pathname === '/api/users/me' && method === 'PUT') {
        updatePayload = init?.body ? JSON.parse(String(init.body)) : null
        return createJsonResponse({
          id: 100,
          fullName: 'Updated Customer',
          email: 'updated@atspaces.com',
          phoneNumber: '+966555111222',
          role: 'customer',
        })
      }

      if (url.pathname === '/api/ai/recommend' && method === 'POST') {
        return createJsonResponse({ message: 'Not implemented' }, 501)
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <CustomerProfilePage />
        </MemoryRouter>
      </AppProviders>,
    )

    const fullNameInput = await screen.findByDisplayValue('Customer User')
    fireEvent.change(fullNameInput, {
      target: { value: 'Updated Customer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(updatePayload).toEqual({
        fullName: 'Updated Customer',
        email: 'customer@atspaces.com',
      })
    })

    expect(screen.getByPlaceholderText('Phone number')).toBeDisabled()
    expect(screen.getByDisplayValue('Riyadh')).toBeDisabled()
  })
})
