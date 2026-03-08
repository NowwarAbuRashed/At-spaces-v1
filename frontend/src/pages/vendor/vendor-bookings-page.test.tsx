import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorBookingsPage } from '@/pages/vendor/vendor-bookings-page'

describe('VendorBookingsPage', () => {
  it('filters bookings and updates status in local state', () => {
    render(<VendorBookingsPage />)

    expect(screen.getByText('Bookings Management')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'confirmed' } })
    expect(screen.getByTestId('booking-booking-2001')).toBeInTheDocument()
    expect(screen.queryByTestId('booking-booking-2002')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'all' } })

    const bookingRow = screen.getByTestId('booking-booking-2001')
    fireEvent.click(within(bookingRow).getByRole('button', { name: 'Mark Completed' }))

    expect(within(bookingRow).getByText('Completed')).toBeInTheDocument()
  })
})
