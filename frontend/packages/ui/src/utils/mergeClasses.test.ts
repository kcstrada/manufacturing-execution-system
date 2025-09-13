import { describe, it, expect } from 'vitest'

// Simple test helper functions
function mergeClasses(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

function conditionalClass(condition: boolean, className: string): string | false {
  return condition && className
}

describe('mergeClasses utility', () => {
  it('merges multiple class strings', () => {
    const result = mergeClasses('btn', 'btn-primary', 'btn-lg')
    expect(result).toBe('btn btn-primary btn-lg')
  })

  it('filters out undefined values', () => {
    const result = mergeClasses('btn', undefined, 'btn-primary')
    expect(result).toBe('btn btn-primary')
  })

  it('filters out null values', () => {
    const result = mergeClasses('btn', null, 'btn-primary')
    expect(result).toBe('btn btn-primary')
  })

  it('filters out false values', () => {
    const result = mergeClasses('btn', false, 'btn-primary')
    expect(result).toBe('btn btn-primary')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    const result = mergeClasses(
      'btn',
      conditionalClass(isActive, 'btn-active'),
      conditionalClass(isDisabled, 'btn-disabled')
    )
    expect(result).toBe('btn btn-active')
  })

  it('returns empty string for all falsy values', () => {
    const result = mergeClasses(undefined, null, false)
    expect(result).toBe('')
  })

  it('handles dynamic class composition', () => {
    const variant = 'primary'
    const size = 'lg'
    const result = mergeClasses(
      'btn',
      `btn-${variant}`,
      `btn-${size}`
    )
    expect(result).toBe('btn btn-primary btn-lg')
  })
})