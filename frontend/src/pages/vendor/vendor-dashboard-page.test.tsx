import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { VendorDashboardPage } from '@/pages/vendor/vendor-dashboard-page'

describe('VendorDashboardPage', () => {
  it('renders kpi cards, recent bookings, branch status, and quick actions', () => {
    render(
      <MemoryRouter>
        <VendorDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Vendor Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Today Occupancy')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Bookings')).toBeInTheDocument()
    expect(screen.getByText('Active Services')).toBeInTheDocument()
    expect(screen.getByText('Pending Requests')).toBeInTheDocument()
    expect(screen.getByText('Recent Bookings')).toBeInTheDocument()
    expect(screen.getByText('Branch Status')).toBeInTheDocument()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Lina Haddad')).toBeInTheDocument()
  })
})
