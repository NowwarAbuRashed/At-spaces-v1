import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { SettingsPage } from '@/pages/management/settings-page'

describe('SettingsPage', () => {
  it('switches between settings tabs', () => {
    render(
      <AppProviders>
        <SettingsPage />
      </AppProviders>,
    )

    expect(screen.getByText('Profile Information')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /activity log/i }))
    expect(screen.getByText('Password changed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /security/i }))
    expect(screen.getByText('Security Controls')).toBeInTheDocument()
  })
})
