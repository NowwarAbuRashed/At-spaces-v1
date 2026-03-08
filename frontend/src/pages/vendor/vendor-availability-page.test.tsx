import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorAvailabilityPage } from '@/pages/vendor/vendor-availability-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorAvailabilityPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('creates an availability slot and upserts it to backend', async () => {
    let lastAvailabilityPayload: unknown = null

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

      if (url.pathname === '/api/vendors/availability' && method === 'PUT') {
        lastAvailabilityPayload = init?.body ? JSON.parse(String(init.body)) : null
        return createJsonResponse({ message: 'Availability updated' })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorAvailabilityPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Availability Management')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Slot' }))

    const dialog = screen.getByRole('dialog', { name: 'Add Availability Slot' })
    fireEvent.change(within(dialog).getByLabelText('Start Time'), { target: { value: '18:00' } })
    fireEvent.change(within(dialog).getByLabelText('End Time'), { target: { value: '19:00' } })
    fireEvent.change(within(dialog).getByLabelText('Available Units'), { target: { value: '4' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Slot' }))

    await waitFor(() => {
      expect(lastAvailabilityPayload).toMatchObject({
        vendorServiceId: 55,
        slots: [
          {
            start: '18:00',
            end: '19:00',
            availableUnits: 4,
          },
        ],
      })
    })
    expect(await screen.findByText('18:00 - 19:00')).toBeInTheDocument()
  })
})
