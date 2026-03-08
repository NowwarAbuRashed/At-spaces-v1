import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorServicesPage } from '@/pages/vendor/vendor-services-page'

describe('VendorServicesPage', () => {
  it('renders service cards and supports mock pricing/features updates', () => {
    render(<VendorServicesPage />)

    expect(screen.getByText('Services Management')).toBeInTheDocument()
    expect(screen.getByText('Vendor Services')).toBeInTheDocument()
    expect(screen.getByText('Premium Desk Slot')).toBeInTheDocument()

    const priceInput = screen.getAllByDisplayValue('28')[0]
    fireEvent.change(priceInput, { target: { value: '30' } })
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()

    fireEvent.change(screen.getAllByPlaceholderText('Feature name')[0], {
      target: { value: 'Projector Access' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Short description')[0], {
      target: { value: 'Portable projector included' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Quantity')[0], {
      target: { value: '1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Unit label')[0], {
      target: { value: 'unit' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Feature' })[0])

    expect(screen.getByText('Projector Access')).toBeInTheDocument()
  })
})
