import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorBranchesPage } from '@/pages/vendor/vendor-branches-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorBranchesPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('loads branch data and submits branch updates to backend', async () => {
    let updatePayload: unknown = null

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

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

      if (url.pathname === '/api/vendors/dashboard') {
        return createJsonResponse({
          todayOccupancy: 70,
          upcomingBookings: 12,
          branchStatus: 'moderate',
        })
      }

      if (url.pathname === '/api/users/me') {
        return createJsonResponse({
          id: 2,
          fullName: 'Vendor Manager',
          email: 'vendor@example.com',
          phoneNumber: '+962700000000',
          role: 'vendor',
        })
      }

      if (url.pathname === '/api/vendors/branches/10' && method === 'PUT') {
        updatePayload = init?.body ? JSON.parse(String(init.body)) : null
        return createJsonResponse({
          id: 10,
          name: 'Main Branch Updated',
          description: 'Updated description',
          city: 'Amman',
          address: 'Updated Address',
          latitude: 31.95,
          longitude: 35.91,
          facilities: [
            {
              id: 1,
              name: 'WiFi',
              icon: 'wifi',
              isAvailable: true,
              description: 'Fast internet',
            },
          ],
          services: [],
        })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorBranchesPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByDisplayValue('Main Branch')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Main Branch'), { target: { value: 'Main Branch Updated' } })
    fireEvent.change(screen.getByDisplayValue('Abdali Boulevard'), { target: { value: 'Updated Address' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updatePayload).toMatchObject({
        name: 'Main Branch Updated',
        address: 'Updated Address',
      })
    })

    expect(await screen.findByText('WiFi')).toBeInTheDocument()
  })
})
