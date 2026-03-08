import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Sidebar } from '@/layouts/sidebar'

describe('Sidebar', () => {
  it('highlights active navigation item', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <Sidebar collapsed={false} />
      </MemoryRouter>,
    )

    const activeLink = screen.getByRole('link', { name: 'Analytics' })
    expect(activeLink).toHaveClass('bg-app-accent')
  })
})

