import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorRequestsPage } from '@/pages/vendor/vendor-requests-page'

describe('VendorRequestsPage', () => {
  it('renders request sections and creates a new request in local state', () => {
    render(<VendorRequestsPage />)

    expect(screen.getByText('Capacity Requests')).toBeInTheDocument()
    expect(screen.getByText('Create Capacity Request')).toBeInTheDocument()
    expect(screen.getByText('Request History')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Submit Capacity Request' }))
    expect(screen.getByText('Reason is required.')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Enter requested capacity'), {
      target: { value: '56' },
    })
    fireEvent.change(
      screen.getByPlaceholderText('Explain why this capacity change is required...'),
      {
        target: { value: 'Need extra weekday slots for corporate team demand.' },
      },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit Capacity Request' }))

    expect(
      screen.getByText('Need extra weekday slots for corporate team demand.'),
    ).toBeInTheDocument()
  })
})
