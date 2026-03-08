import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorBookingsPage } from '@/pages/vendor/vendor-bookings-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorBookingsPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('renders bookings and updates booking status via backend endpoint', async () => {
    let bookingStatus: 'confirmed' | 'completed' = 'confirmed'
    let patchPayload: unknown = null

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

      if (url.pathname === '/api/vendors/bookings' && method === 'GET') {
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
              status: bookingStatus,
            },
          ],
          page: 1,
          limit: 200,
          total: 1,
          hasNext: false,
        })
      }

      if (url.pathname === '/api/vendors/bookings/900/status' && method === 'PATCH') {
        patchPayload = init?.body ? JSON.parse(String(init.body)) : null
        bookingStatus = 'completed'
        return createJsonResponse({
          id: 900,
          status: 'completed',
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorBookingsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    const bookingRow = await screen.findByTestId('booking-900')
    fireEvent.click(within(bookingRow).getByRole('button', { name: 'Mark Completed' }))

    await waitFor(() => {
      expect(patchPayload).toEqual({ status: 'completed' })
    })
    expect(await within(bookingRow).findByText('Completed')).toBeInTheDocument()
  })
})
