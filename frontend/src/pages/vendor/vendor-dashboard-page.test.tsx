import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorDashboardPage } from '@/pages/vendor/vendor-dashboard-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorDashboardPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()

    mockFetch(async (input) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())

      if (url.pathname === '/api/vendors/dashboard') {
        return createJsonResponse({
          todayOccupancy: 66,
          upcomingBookings: 5,
          branchStatus: 'moderate',
        })
      }

      if (url.pathname === '/api/vendors/branches/me') {
        return createJsonResponse([
          {
            id: 10,
            name: 'Main Branch',
            city: 'Amman',
            address: 'Abdali Boulevard',
          },
        ])
      }

      if (url.pathname === '/api/vendors/vendor-services') {
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

      if (url.pathname === '/api/vendors/bookings') {
        return createJsonResponse({
          items: [
            {
              id: 900,
              bookingNumber: 'BKG-20260308-0001',
              vendorServiceId: 55,
              branchId: 10,
              branchName: 'Main Branch',
              startTime: '2026-03-08T10:00:00.000Z',
              endTime: '2026-03-08T11:00:00.000Z',
              quantity: 2,
              status: 'confirmed',
            },
          ],
          page: 1,
          limit: 200,
          total: 1,
          hasNext: false,
        })
      }

      if (url.pathname === '/api/notifications') {
        return createJsonResponse({
          items: [],
          page: 1,
          limit: 200,
          total: 0,
          hasNext: false,
        })
      }

      throw new Error(`Unhandled request in test: ${url.pathname}`)
    })
  })

  it('renders dashboard metrics and recent bookings from API data', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <VendorDashboardPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Vendor Dashboard')).toBeInTheDocument()
    expect(await screen.findByText('66%')).toBeInTheDocument()
    expect(await screen.findByText('BKG-20260308-0001')).toBeInTheDocument()
    expect(await screen.findByText('Main Branch')).toBeInTheDocument()
  })
})
