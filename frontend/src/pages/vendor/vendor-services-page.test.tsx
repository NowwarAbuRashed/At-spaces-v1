import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorServicesPage } from '@/pages/vendor/vendor-services-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorServicesPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('loads services and updates pricing through backend mutation', async () => {
    let servicePrice = 25
    let updatePayload: unknown = null

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
              pricePerUnit: servicePrice,
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

      if (url.pathname === '/api/vendors/vendor-services/55/price' && method === 'PUT') {
        updatePayload = init?.body ? JSON.parse(String(init.body)) : null
        const payload = updatePayload as { pricePerUnit: number; priceUnit: string }
        servicePrice = payload.pricePerUnit
        return createJsonResponse({
          vendorServiceId: 55,
          serviceId: 1,
          name: 'Hot Desk',
          pricePerUnit: servicePrice,
          priceUnit: payload.priceUnit,
          maxCapacity: 40,
          isAvailable: true,
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorServicesPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Hot Desk')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('25'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Pricing' }))

    await waitFor(() => {
      expect(updatePayload).toEqual({
        pricePerUnit: 30,
        priceUnit: 'hour',
      })
    })
  })
})
