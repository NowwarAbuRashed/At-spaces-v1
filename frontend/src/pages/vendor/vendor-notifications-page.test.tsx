import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { VendorNotificationsPage } from '@/pages/vendor/vendor-notifications-page'
import {
  createJsonResponse,
  mockFetch,
  setVendorSession,
  setupBrowserStorageMocks,
} from '@/pages/vendor/test-utils'

describe('VendorNotificationsPage', () => {
  beforeEach(() => {
    setupBrowserStorageMocks()
    setVendorSession()
  })

  it('loads notifications and marks single/all notifications as read', async () => {
    const readState = new Map<number, boolean>([
      [1, false],
      [2, false],
      [3, true],
    ])

    mockFetch(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = init?.method ?? 'GET'

      if (url.pathname === '/api/notifications' && method === 'GET') {
        return createJsonResponse({
          items: [
            {
              id: 1,
              type: 'capacity_request',
              title: 'Capacity Request Updated',
              body: 'Your request has been reviewed.',
              isRead: readState.get(1),
              createdAt: '2026-03-08T09:00:00.000Z',
            },
            {
              id: 2,
              type: 'operations_alert',
              title: 'Operational Alert',
              body: 'Peak demand expected today.',
              isRead: readState.get(2),
              createdAt: '2026-03-08T08:00:00.000Z',
            },
            {
              id: 3,
              type: 'security_notice',
              title: 'Security Reminder',
              body: 'Rotate manager credentials this week.',
              isRead: readState.get(3),
              createdAt: '2026-03-07T08:00:00.000Z',
            },
          ],
          page: 1,
          limit: 200,
          total: 3,
          hasNext: false,
        })
      }

      if (url.pathname === '/api/notifications/1/read' && method === 'PATCH') {
        readState.set(1, true)
        return createJsonResponse({ message: 'ok' })
      }

      if (url.pathname === '/api/notifications/2/read' && method === 'PATCH') {
        readState.set(2, true)
        return createJsonResponse({ message: 'ok' })
      }

      throw new Error(`Unhandled request in test: ${method} ${url.pathname}`)
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <VendorNotificationsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('2 unread')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Unread/i }))
    expect(screen.getByText('Capacity Request Updated')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as read' })[0])
    await waitFor(() => {
      expect(screen.getByText('1 unread')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    await waitFor(() => {
      expect(screen.getByText('0 unread')).toBeInTheDocument()
    })
  })
})
