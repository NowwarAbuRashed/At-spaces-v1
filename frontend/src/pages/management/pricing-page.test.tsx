import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PricingPage } from '@/pages/management/pricing-page'

describe('PricingPage', () => {
  it('changes visible tiers when pricing tab changes', () => {
    render(<PricingPage />)

    expect(screen.getByText('Hourly')).toBeInTheDocument()
    expect(screen.queryByText('Boardroom (12p)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /meeting room/i }))

    expect(screen.getByText('Boardroom (12p)')).toBeInTheDocument()
  })
})

