import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { NotificationsPage } from '@/pages/management/notifications-page'

describe('NotificationsPage', () => {
  it('filters notifications by category tab', () => {
    render(
      <AppProviders>
        <NotificationsPage />
      </AppProviders>,
    )

    fireEvent.click(screen.getByRole('tab', { name: /security/i }))

    expect(screen.getByText('Unusual Login Detected')).toBeInTheDocument()
    expect(screen.queryByText('New Approval Request')).not.toBeInTheDocument()
  })
})
