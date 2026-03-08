import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorSettingsPage } from '@/pages/vendor/vendor-settings-page'

describe('VendorSettingsPage', () => {
  it('renders profile settings and supports local edits/toggles', () => {
    render(<VendorSettingsPage />)

    expect(screen.getByText('Vendor Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile & Preferences')).toBeInTheDocument()

    const fullNameInput = screen.getByDisplayValue('Maya Al-Masri')
    fireEvent.change(fullNameInput, { target: { value: 'Maya A. Masri' } })
    expect(screen.getByDisplayValue('Maya A. Masri')).toBeInTheDocument()

    const smsAlertsSwitch = screen.getByRole('switch', { name: 'SMS Alerts' })
    expect(smsAlertsSwitch).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(smsAlertsSwitch)
    expect(smsAlertsSwitch).toHaveAttribute('aria-checked', 'true')
  })
})
