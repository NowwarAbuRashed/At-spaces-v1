import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorAvailabilityPage } from '@/pages/vendor/vendor-availability-page'

describe('VendorAvailabilityPage', () => {
  it('validates slot time range and allows adding a slot in local state', () => {
    render(<VendorAvailabilityPage />)

    expect(screen.getByText('Availability Management')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add Slot' }))

    const dialog = screen.getByRole('dialog', { name: 'Add Availability Slot' })

    fireEvent.change(within(dialog).getByLabelText('Start Time'), { target: { value: '18:00' } })
    fireEvent.change(within(dialog).getByLabelText('End Time'), { target: { value: '17:00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Slot' }))

    expect(screen.getByText('Start time must be earlier than end time.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('End Time'), { target: { value: '19:00' } })
    fireEvent.change(within(dialog).getByLabelText('Available Units'), { target: { value: '4' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Slot' }))

    expect(screen.getByText('18:00 - 19:00')).toBeInTheDocument()
  })
})
