import { describe, it, expect } from 'vitest'

// Simple validation utilities for testing
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function isValidDate(date: string): boolean {
  const parsed = Date.parse(date)
  return !isNaN(parsed)
}

export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@domain.org')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('validates correct phone numbers', () => {
      expect(isValidPhone('+1234567890')).toBe(true)
      expect(isValidPhone('123-456-7890')).toBe(true)
      expect(isValidPhone('(123) 456-7890')).toBe(true)
      expect(isValidPhone('1234567890')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('abcdefghij')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('validates correct date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('01/15/2024')).toBe(true)
      expect(isValidDate('Jan 15, 2024')).toBe(true)
      expect(isValidDate('2024-01-15T10:30:00')).toBe(true)
    })

    it('rejects invalid date strings', () => {
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('2024-13-45')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })
  })

  describe('isWithinRange', () => {
    it('validates values within range', () => {
      expect(isWithinRange(5, 1, 10)).toBe(true)
      expect(isWithinRange(1, 1, 10)).toBe(true)
      expect(isWithinRange(10, 1, 10)).toBe(true)
      expect(isWithinRange(0, -5, 5)).toBe(true)
    })

    it('rejects values outside range', () => {
      expect(isWithinRange(0, 1, 10)).toBe(false)
      expect(isWithinRange(11, 1, 10)).toBe(false)
      expect(isWithinRange(-6, -5, 5)).toBe(false)
    })
  })
})