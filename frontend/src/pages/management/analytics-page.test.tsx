import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { AnalyticsPage } from '@/pages/management/analytics-page'

describe('AnalyticsPage', () => {
  it('updates metric values when range tab changes', () => {
    render(
      <AppProviders>
        <AnalyticsPage />
      </AppProviders>,
    )

    expect(screen.getByText('28,410')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /this week/i }))

    expect(screen.getByText('6,932')).toBeInTheDocument()
    expect(screen.queryByText('28,410')).not.toBeInTheDocument()
  })
})
