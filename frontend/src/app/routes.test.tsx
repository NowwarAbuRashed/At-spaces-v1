import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { AppRoutes } from '@/app/routes'

function renderRoutes(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('AppRoutes', () => {
  it('renders customer home route', () => {
    renderRoutes('/')
    expect(screen.getByText('Book your ideal space with confidence')).toBeInTheDocument()
  })

  it('renders customer login route', () => {
    renderRoutes('/login')
    expect(screen.getByText('Sign in to continue booking')).toBeInTheDocument()
  })

  it('renders branch details route', () => {
    renderRoutes('/branches/not-a-number')
    expect(screen.getByText('Branch not found')).toBeInTheDocument()
  })

  it('redirects unknown routes to customer home', () => {
    renderRoutes('/unknown-page')
    expect(screen.getByText('Book your ideal space with confidence')).toBeInTheDocument()
  })
})
