import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function for merging CSS class names
 * Uses clsx for conditional classes and combines them efficiently
 * 
 * @param inputs - Array of class values (strings, conditionals, objects)
 * @returns Merged class string
 * 
 * @example
 * cn('base-class', { 'conditional-class': condition }, 'another-class')
 * cn(['array', 'of', 'classes'], condition && 'conditional')
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Utility function to merge default classes with custom classes
 * Useful for component libraries where you want to provide defaults
 * but allow customization
 * 
 * @param defaultClasses - Default classes as a string
 * @param customClasses - Custom classes to merge
 * @returns Merged class string
 * 
 * @example
 * mergeClasses('btn btn-primary', 'my-custom-class')
 */
export function mergeClasses(defaultClasses: string, customClasses?: string): string {
  return cn(defaultClasses, customClasses);
}

/**
 * Utility function to conditionally apply classes
 * 
 * @param condition - Boolean condition
 * @param trueClasses - Classes to apply when condition is true
 * @param falseClasses - Classes to apply when condition is false
 * @returns Conditional class string
 * 
 * @example
 * conditionalClasses(isActive, 'active', 'inactive')
 */
export function conditionalClasses(
  condition: boolean, 
  trueClasses: string, 
  falseClasses?: string
): string {
  return condition ? trueClasses : (falseClasses || '');
}

/**
 * Utility function to create variant-based class mappings
 * 
 * @param variant - Current variant
 * @param variants - Object mapping variants to classes
 * @param defaultVariant - Default variant if current variant is not found
 * @returns Variant class string
 * 
 * @example
 * variantClasses('primary', {
 *   primary: 'btn-primary',
 *   secondary: 'btn-secondary'
 * }, 'primary')
 */
export function variantClasses<T extends string>(
  variant: T,
  variants: Record<T, string>,
  defaultVariant?: T
): string {
  return variants[variant] || (defaultVariant ? variants[defaultVariant] : '');
}