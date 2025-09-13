import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('base-class', 'additional-class')
    expect(result).toBe('base-class additional-class')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('filters out falsy values', () => {
    const result = cn('base', false, null, undefined, '', 'valid')
    expect(result).toBe('base valid')
  })

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4') // tailwind-merge correctly overrides px-2 with px-4
  })

  it('handles arrays of classes', () => {
    const result = cn(['base', 'modifier'], 'additional')
    expect(result).toBe('base modifier additional')
  })

  it('handles objects with conditional classes', () => {
    const result = cn('base', {
      'active': true,
      'disabled': false,
      'highlighted': true
    })
    expect(result).toBe('base active highlighted')
  })

  it('returns empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles complex nested conditions', () => {
    const theme = 'dark'
    const size = 'lg'
    const result = cn(
      'btn',
      theme === 'dark' && 'btn-dark',
      size === 'lg' && 'btn-lg',
      {
        'btn-active': true,
        'btn-disabled': false
      }
    )
    expect(result).toBe('btn btn-dark btn-lg btn-active')
  })
})