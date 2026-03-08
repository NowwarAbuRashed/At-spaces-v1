import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { CustomerBookingPreviewPage } from '@/pages/customer/customer-booking-preview-page'
import {
  createJsonResponse,
  mockFetch,
  setCustomerSession,
  setupBrowserStorageMocks,
} from '@/pages/customer/test-utils'

describe('CustomerBookingPreviewPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setCustomerSession()
  })

  it('creates booking through backend integration flow', async () => {
    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/services' && method === 'GET') {
        return createJsonResponse([{ id: 1, name: 'Meeting Room', unit: 'room' }])
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
          facilities: [],
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

      if (url.pathname === '/api/availability/check' && method === 'POST') {
        return createJsonResponse({ available: true, price: 220 })
      }

      if (url.pathname === '/api/bookings/preview' && method === 'POST') {
        return createJsonResponse({ totalPrice: 220, currency: 'JOD' })
      }

      if (url.pathname === '/api/bookings' && method === 'POST') {
        return createJsonResponse({
          bookingId: 900,
          bookingNumber: 'BKG-20260308-0001',
          totalPrice: 220,
          status: 'pending',
          paymentStatus: 'pending',
        }, 201)
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/booking-preview?branchId=10&serviceId=1&vendorServiceId=55']}>
          <Routes>
            <Route path="/booking-preview" element={<CustomerBookingPreviewPage />} />
            <Route path="/my-bookings" element={<div>My Bookings Target</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Create booking' }))

    expect(await screen.findByText('My Bookings Target')).toBeInTheDocument()
  })
})
