import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ConsentCheckbox } from '@/components/verify/ConsentCheckbox'

describe('ConsentCheckbox', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders unchecked by default', () => {
    const handleChange = vi.fn()
    render(<ConsentCheckbox checked={false} onChange={handleChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn()
    render(<ConsentCheckbox checked={false} onChange={handleChange} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('renders disabled state', () => {
    const handleChange = vi.fn()
    render(<ConsentCheckbox checked={false} onChange={handleChange} disabled={true} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })
})
