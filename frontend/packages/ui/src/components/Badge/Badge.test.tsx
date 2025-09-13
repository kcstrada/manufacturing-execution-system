import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge Component', () => {
  it('renders with children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies primary variant class by default', () => {
    render(<Badge>Primary</Badge>)
    const badge = screen.getByText('Primary')
    expect(badge).toHaveClass('badge-primary')
  })

  it('applies variant classes correctly', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('badge-success')
  })

  it('applies size classes correctly', () => {
    render(<Badge size="lg">Large</Badge>)
    const badge = screen.getByText('Large')
    expect(badge).toHaveClass('badge-lg')
  })

  it('applies outline class when outline is true', () => {
    render(<Badge outline>Outline</Badge>)
    const badge = screen.getByText('Outline')
    expect(badge).toHaveClass('badge-outline')
  })

  it('renders dot when dot prop is true', () => {
    render(<Badge dot>With Dot</Badge>)
    const container = screen.getByText('With Dot').parentElement
    expect(container?.querySelector('.w-2.h-2')).toBeInTheDocument()
  })

  it('combines multiple props correctly', () => {
    render(
      <Badge variant="warning" size="sm" outline>
        Complex
      </Badge>
    )
    const badge = screen.getByText('Complex')
    expect(badge).toHaveClass('badge', 'badge-warning', 'badge-sm', 'badge-outline')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders different variants', () => {
    const variants = ['info', 'success', 'warning', 'error'] as const
    
    variants.forEach(variant => {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>)
      const badge = container.querySelector(`.badge-${variant}`)
      expect(badge).toBeInTheDocument()
    })
  })
})