import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { ApprovalsPage } from '@/pages/management/approvals-page'

describe('ApprovalsPage', () => {
  it('filters requests by selected tab', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <ApprovalsPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(screen.getByText('REQ-001')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /approved/i }))

    expect(screen.getByText('REQ-004')).toBeInTheDocument()
    expect(screen.queryByText('REQ-001')).not.toBeInTheDocument()
  })
})
