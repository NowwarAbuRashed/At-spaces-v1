import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorRequestsPage } from '@/pages/vendor/vendor-requests-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorRequestsPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('submits capacity request to backend and shows it in session history', async () => {
    let createPayload: unknown = null

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/vendors/vendor-services' && method === 'GET') {
        return createJsonResponse({
          items: [
            {
              vendorServiceId: 55,
              serviceId: 1,
              name: 'Hot Desk',
              pricePerUnit: 25,
              priceUnit: 'hour',
              maxCapacity: 40,
              isAvailable: true,
            },
          ],
          page: 1,
          limit: 100,
          total: 1,
          hasNext: false,
        })
      }

      if (url.pathname === '/api/vendors/vendor-services/55/capacity-request' && method === 'POST') {
        createPayload = init?.body ? JSON.parse(String(init.body)) : null
        return createJsonResponse(
          {
            requestId: 301,
            status: 'pending',
          },
          202,
        )
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorRequestsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Capacity Requests')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Capacity Request' }))
    expect(screen.getByText('Reason is required.')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Enter requested capacity'), {
      target: { value: '56' },
    })
    fireEvent.change(screen.getByPlaceholderText('Explain why this capacity change is required...'), {
      target: { value: 'Need extra weekday slots for corporate demand.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Capacity Request' }))

    await waitFor(() => {
      expect(createPayload).toEqual({
        newCapacity: 56,
        reason: 'Need extra weekday slots for corporate demand.',
      })
    })

    expect(await screen.findByText('Need extra weekday slots for corporate demand.')).toBeInTheDocument()
    expect(screen.getByText('Request ID: 301')).toBeInTheDocument()
  })
})
