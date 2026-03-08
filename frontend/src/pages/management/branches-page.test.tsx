import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { BranchesPage } from '@/pages/management/branches-page'

describe('BranchesPage', () => {
  it('filters cards by search input', () => {
    render(
      <AppProviders>
        <BranchesPage />
      </AppProviders>,
    )

    expect(screen.getByText('Amman Downtown Hub')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search branches...'), {
      target: { value: 'salt' },
    })

    expect(screen.getByText('Salt Creative Hub')).toBeInTheDocument()
    expect(screen.queryByText('Amman Downtown Hub')).not.toBeInTheDocument()
  })
})
