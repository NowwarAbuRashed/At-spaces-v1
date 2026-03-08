import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { CustomerBranchesPage } from '@/pages/customer/customer-branches-page'
import {
  createJsonResponse,
  mockFetch,
  setupBrowserStorageMocks,
} from '@/pages/customer/test-utils'

describe('CustomerBranchesPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
  })

  it('renders branches from backend integration data', async () => {
    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/services' && method === 'GET') {
        return createJsonResponse([
          { id: 1, name: 'Meeting Room', unit: 'room' },
        ])
      }

      if (url.pathname === '/api/facilities' && method === 'GET') {
        return createJsonResponse([
          { id: 1, name: 'WiFi', icon: 'wifi' },
        ])
      }

      if (url.pathname === '/api/branches' && method === 'GET') {
        return createJsonResponse({
          items: [
            { id: 10, name: 'Riyadh Central', city: 'Riyadh', address: 'Olaya Street' },
          ],
          page: 1,
          limit: 20,
          total: 1,
          hasNext: false,
        })
      }

      if (url.pathname === '/api/branches/10' && method === 'GET') {
        return createJsonResponse({
          id: 10,
          name: 'Riyadh Central',
          description: 'Business-ready branch',
          city: 'Riyadh',
          address: 'Olaya Street',
          latitude: null,
          longitude: null,
          facilities: [
            { id: 1, name: 'WiFi', icon: 'wifi', isAvailable: true, description: 'Fast internet' },
          ],
          services: [
            {
              vendorServiceId: 55,
              serviceId: 1,
              name: 'Meeting Room',
              pricePerUnit: 220,
              priceUnit: 'hour',
              maxCapacity: 8,
              isAvailable: true,
            },
          ],
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <CustomerBranchesPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Riyadh Central')).toBeInTheDocument()
    expect(screen.getAllByText('Meeting Room').length).toBeGreaterThan(0)
  })
})
