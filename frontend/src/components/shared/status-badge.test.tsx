import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/shared/status-badge'

describe('StatusBadge', () => {
  it('renders readable text for camelCase statuses', () => {
    render(<StatusBadge status="underReview" />)

    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })
})

