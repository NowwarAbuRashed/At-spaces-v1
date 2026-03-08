import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorBranchesPage } from '@/pages/vendor/vendor-branches-page'

describe('VendorBranchesPage', () => {
  it('renders branch details and allows local editing/toggling', () => {
    render(<VendorBranchesPage />)

    expect(screen.getByText('Branch Management')).toBeInTheDocument()
    expect(screen.getByText('Facilities Management')).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('Amman Downtown Hub')
    fireEvent.change(nameInput, { target: { value: 'Amman Business Hub' } })
    expect(screen.getByDisplayValue('Amman Business Hub')).toBeInTheDocument()

    const firstSwitch = screen.getAllByRole('switch')[0]
    expect(firstSwitch).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(firstSwitch)
    expect(firstSwitch).toHaveAttribute('aria-checked', 'false')
  })
})
