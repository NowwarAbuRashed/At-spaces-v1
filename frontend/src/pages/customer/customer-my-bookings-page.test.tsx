import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { CustomerMyBookingsPage } from '@/pages/customer/customer-my-bookings-page'
import {
  createJsonResponse,
  createTextResponse,
  mockFetch,
  setCustomerSession,
  setupBrowserStorageMocks,
} from '@/pages/customer/test-utils'

function setupBookingsApi() {
  let bookingStatus: 'pending' | 'cancelled' = 'pending'

  mockFetch(async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    const method = init?.method ?? 'GET'

    if (url.pathname === '/api/bookings/my' && method === 'GET') {
      return createJsonResponse({
        items: [
          {
            id: 900,
            bookingNumber: 'BKG-20260308-0001',
            branchName: 'Riyadh Central',
            startTime: '2026-03-08T10:00:00.000Z',
            endTime: '2026-03-08T12:00:00.000Z',
            status: bookingStatus,
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
        hasNext: false,
      })
    }

    if (url.pathname === '/api/bookings/900' && method === 'GET') {
      return createJsonResponse({
        id: 900,
        bookingNumber: 'BKG-20260308-0001',
        branchName: 'Riyadh Central',
        startTime: '2026-03-08T10:00:00.000Z',
        endTime: '2026-03-08T12:00:00.000Z',
        status: bookingStatus,
        quantity: 2,
        totalPrice: 440,
        vendorServiceId: 55,
      })
    }

    if (url.pathname === '/api/bookings/900/cancel' && method === 'POST') {
      bookingStatus = 'cancelled'
      return createJsonResponse({ message: 'Booking cancelled' })
    }

    if (url.pathname === '/api/bookings/900/calendar.ics' && method === 'GET') {
      return createTextResponse('BEGIN:VCALENDAR\r\nEND:VCALENDAR')
    }

    if (url.pathname === '/api/branches' && method === 'GET') {
      return createJsonResponse({
        items: [{ id: 10, name: 'Riyadh Central', city: 'Riyadh', address: 'Olaya Street' }],
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
        description: 'Branch details',
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

    throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
  })
}

describe('CustomerMyBookingsPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setCustomerSession()
  })

  it('renders my bookings from backend responses', async () => {
    setupBookingsApi()

    render(
      <AppProviders>
        <MemoryRouter>
          <CustomerMyBookingsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('BKG-20260308-0001')).toBeInTheDocument()
    expect(screen.getByText('Meeting Room')).toBeInTheDocument()
  })

  it('cancels booking through backend endpoint', async () => {
    setupBookingsApi()

    render(
      <AppProviders>
        <MemoryRouter>
          <CustomerMyBookingsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel Booking' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm cancel' }))

    await waitFor(() => {
      expect(screen.getByText('1 cancelled')).toBeInTheDocument()
    })
  })

  it('exports booking calendar via ICS endpoint', async () => {
    setupBookingsApi()
    const createObjectUrlMock = vi.fn(() => 'blob:ics')
    const revokeObjectUrlMock = vi.fn()
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: createObjectUrlMock,
      configurable: true,
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: revokeObjectUrlMock,
      configurable: true,
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <CustomerMyBookingsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Add to Calendar' }))

    await waitFor(() => {
      expect(createObjectUrlMock).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Exported' })).toBeInTheDocument()
    })
  })
})
