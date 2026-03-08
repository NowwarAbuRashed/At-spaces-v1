import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from '@/components/ui/tabs'

describe('Tabs', () => {
  it('calls onChange with selected value', () => {
    const onChange = vi.fn()

    render(
      <Tabs
        value="all"
        onChange={onChange}
        items={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: /pending/i }))
    expect(onChange).toHaveBeenCalledWith('pending')
  })
})

