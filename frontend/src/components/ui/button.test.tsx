import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders primary variant by default', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveClass('bg-app-accent')
  })

  it('shows loading icon when isLoading is true', () => {
    render(<Button isLoading>Saving</Button>)

    const button = screen.getByRole('button', { name: /saving/i })
    expect(button).toBeDisabled()
  })
})

