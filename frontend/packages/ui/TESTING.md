# Component Testing with React Testing Library

## Overview

This UI package uses React Testing Library for component testing. React Testing Library provides utilities to test React components in a way that resembles how users interact with your app.

## Test Setup

### Configuration Files

1. **vitest.config.ts** - Main test configuration
   - Uses Vitest as the test runner
   - Configured with jsdom environment for DOM simulation
   - React plugin for JSX transformation
   - Path aliases for module resolution

2. **src/test/setup.ts** - Test environment setup
   - Imports `@testing-library/jest-dom` for additional matchers
   - Configures automatic cleanup after each test

### Dependencies

- **vitest**: Fast test runner built on Vite
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: Simulates user interactions
- **jsdom**: JavaScript implementation of the DOM
- **@vitejs/plugin-react**: React support for Vite

## Writing Tests

### Basic Component Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { YourComponent } from './YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    // Assertions
  })
})
```

### Common Testing Patterns

#### 1. Testing Component Rendering
```typescript
it('renders with children text', () => {
  render(<Button>Click me</Button>)
  const button = screen.getByRole('button')
  expect(button).toHaveTextContent('Click me')
})
```

#### 2. Testing Props and Variants
```typescript
it('applies variant classes correctly', () => {
  render(<Button variant="primary">Primary</Button>)
  const button = screen.getByRole('button')
  expect(button).toHaveClass('btn-primary')
})
```

#### 3. Testing User Interactions
```typescript
it('handles click events', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click</Button>)
  
  const button = screen.getByRole('button')
  fireEvent.click(button)
  
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

#### 4. Testing Disabled States
```typescript
it('disables button when disabled prop is true', () => {
  render(<Button disabled>Disabled</Button>)
  const button = screen.getByRole('button')
  expect(button).toBeDisabled()
})
```

#### 5. Testing Conditional Rendering
```typescript
it('shows loading spinner when loading', () => {
  render(<Button isLoading>Loading</Button>)
  const spinner = screen.getByTestId('loading-spinner')
  expect(spinner).toBeInTheDocument()
})
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme Hook', () => {
  it('toggles theme', () => {
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.theme).toBe('light')
    
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('dark')
  })
})
```

## Available Matchers

React Testing Library with jest-dom provides these matchers:

- **toBeInTheDocument()** - Element exists in DOM
- **toHaveTextContent()** - Element contains text
- **toHaveClass()** - Element has CSS class
- **toBeDisabled()** - Element is disabled
- **toBeVisible()** - Element is visible
- **toHaveAttribute()** - Element has attribute
- **toHaveStyle()** - Element has inline styles

## Query Methods

### Priority Order (Recommended)
1. **getByRole** - Queries by ARIA role
2. **getByLabelText** - For form inputs
3. **getByPlaceholderText** - Input placeholders
4. **getByText** - Text content
5. **getByTestId** - Test-specific selector

### Query Variants
- **getBy...** - Returns element or throws error
- **queryBy...** - Returns element or null
- **findBy...** - Returns promise (for async)
- **getAllBy...** - Returns array of elements

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test src/components/Button.test.tsx

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Test File Examples

### Button Component Test
See `src/components/simple/SimpleButton.test.tsx` for a complete example of:
- Rendering tests
- Prop validation
- Event handling
- State management
- Accessibility testing

### Badge Component Test
See `src/components/data-display/Badge.test.tsx` for examples of:
- Visual variant testing
- Conditional rendering
- Class name assertions
- Custom prop combinations

### Hook Test
See `src/hooks/useTheme.test.tsx` for examples of:
- Hook state testing
- Side effect testing
- localStorage interaction
- Event listener cleanup

## Best Practices

1. **Test User Behavior**: Focus on how users interact with components
2. **Avoid Implementation Details**: Don't test internal state or methods
3. **Use Semantic Queries**: Prefer role-based queries over test IDs
4. **Keep Tests Simple**: One assertion per test when possible
5. **Mock External Dependencies**: Use vi.mock() for external modules
6. **Test Accessibility**: Ensure components are accessible
7. **Clean Test Data**: Use beforeEach/afterEach for setup/cleanup

## Troubleshooting

### Common Issues

1. **React Version Conflicts**
   - Ensure all packages use the same React version
   - Check with `npm ls react`

2. **Module Resolution**
   - Verify tsconfig.json paths
   - Check vitest.config.ts aliases

3. **DOM Not Found**
   - Ensure jsdom environment is configured
   - Check if element exists before querying

4. **Async Issues**
   - Use findBy for async elements
   - Use waitFor for assertions
   - Use act() for state updates

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:
```bash
open coverage/index.html
```

Coverage goals:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%