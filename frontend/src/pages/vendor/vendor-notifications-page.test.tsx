import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorNotificationsPage } from '@/pages/vendor/vendor-notifications-page'

describe('VendorNotificationsPage', () => {
  it('filters notifications and updates read state in local state', () => {
    render(<VendorNotificationsPage />)

    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('2 unread')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Unread/i }))
    expect(screen.getByText('Capacity Request Updated')).toBeInTheDocument()
    expect(screen.queryByText('Security Reminder')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as read' })[0])
    expect(screen.getByText('1 unread')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(screen.getByText('0 unread')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Requests/i }))
    expect(screen.getByText('Capacity Request Updated')).toBeInTheDocument()
    expect(screen.queryByText('Operational Alert')).not.toBeInTheDocument()
  })
})
