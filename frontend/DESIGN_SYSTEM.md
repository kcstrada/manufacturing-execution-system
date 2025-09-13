# Unimore Design System

## Overview

The Manufacturing Execution System uses a design system based on Unimore Trading's visual identity. This document outlines the design principles, color palette, typography, and component guidelines.

## Design Principles

1. **Professional & Trustworthy**: Deep navy and ocean blue colors convey stability and expertise
2. **Clean & Modern**: Minimalist approach with ample whitespace and clear hierarchy
3. **Accessible**: High contrast ratios and clear typography for readability
4. **Consistent**: Unified visual language across all applications
5. **Industrial**: Subtle references to manufacturing and trading

## Color Palette

### Brand Colors

```css
/* Primary Colors */
--color-navy: #00253a;        /* Deep Navy - Primary brand color */
--color-navy-dark: #001829;   /* Darker navy for hover states */
--color-navy-light: #003d5c;  /* Lighter navy variant */

/* Secondary Colors */
--color-blue: #056389;        /* Ocean Blue - Secondary brand color */
--color-blue-dark: #044e6b;   /* Darker blue for hover states */
--color-blue-light: #0678a7;  /* Lighter blue for accents */
--color-blue-ice: #e6f4f9;    /* Very light blue for backgrounds */

/* Neutral Colors */
--color-white: #ffffff;       /* Pure white */
--color-white-off: #F5FBFE;   /* Off-white for subtle backgrounds */
```

### Semantic Colors

```css
--color-primary: #056389;     /* Ocean Blue */
--color-secondary: #00253a;   /* Deep Navy */
--color-accent: #0678a7;      /* Light Blue */
--color-success: #10b981;     /* Green */
--color-warning: #f59e0b;     /* Amber */
--color-error: #ef4444;       /* Red */
--color-info: #0678a7;        /* Light Blue */
```

### Manufacturing Status Colors

```css
--status-idle: #9ca3af;       /* Gray */
--status-running: #10b981;    /* Green */
--status-maintenance: #f59e0b;/* Amber */
--status-error: #ef4444;      /* Red */
--status-completed: #22c55e;  /* Bright Green */
--status-pending: #056389;    /* Ocean Blue */
--status-quality-check: #0678a7; /* Light Blue */
```

## Typography

### Font Families

```css
/* Primary Font */
font-family: 'Poppins', system-ui, -apple-system, sans-serif;

/* Secondary Font (for special headings) */
font-family: 'Century Gothic', 'CenturyGothic', sans-serif;

/* Monospace (for code/data) */
font-family: 'JetBrains Mono', 'Menlo', monospace;
```

### Font Sizes

| Size | rem    | px   | Usage                    |
|------|--------|------|--------------------------|
| xs   | 0.75   | 12px | Small labels, captions   |
| sm   | 0.875  | 14px | Secondary text, labels   |
| base | 1      | 16px | Body text               |
| lg   | 1.125  | 18px | Large body text         |
| xl   | 1.25   | 20px | Small headings          |
| 2xl  | 1.5    | 24px | Section headings        |
| 3xl  | 1.875  | 30px | Page headings           |
| 4xl  | 2.25   | 36px | Large headings          |
| 5xl  | 3      | 48px | Hero headings           |
| 6xl  | 3.75   | 60px | Display text            |

### Letter Spacing

- **Body text**: 0.094em (1.5px at 16px base)
- **Headings**: -0.02em (tighter)
- **Buttons**: 0.025em (slightly wider)

## Components

### Buttons

```tsx
import { Button } from '@mes/ui';

// Primary Button
<Button variant="primary">Save Changes</Button>

// Secondary Button
<Button variant="secondary">Cancel</Button>

// Outline Button
<Button variant="outline">Learn More</Button>

// With Icons
<Button variant="primary" leftIcon={<SaveIcon />}>
  Save
</Button>
```

### Typography Components

```tsx
import { Heading, Text } from '@mes/ui';

// Headings
<Heading as="h1" size="5xl" color="navy">
  Manufacturing Dashboard
</Heading>

// Body Text
<Text size="base" color="gray" tracking="body">
  Monitor and control your production lines in real-time.
</Text>
```

### Card Component

```tsx
<Card className="p-6">
  <Heading as="h3" size="xl">Production Status</Heading>
  <Text color="muted">Current shift performance metrics</Text>
</Card>
```

## Spacing System

| Token | rem  | px   | Usage                    |
|-------|------|------|--------------------------|
| xs    | 0.25 | 4px  | Tight spacing            |
| sm    | 0.5  | 8px  | Small gaps               |
| md    | 1    | 16px | Default spacing          |
| lg    | 1.5  | 24px | Section spacing          |
| xl    | 2    | 32px | Large sections           |
| 2xl   | 3    | 48px | Major sections           |
| 3xl   | 4    | 64px | Page sections            |

## Shadow System

Shadows use the Unimore navy color for a cohesive look:

```css
/* Small shadow */
box-shadow: 0 1px 2px 0 rgba(0, 37, 58, 0.05);

/* Default shadow */
box-shadow: 0 1px 3px 0 rgba(0, 37, 58, 0.1);

/* Medium shadow */
box-shadow: 0 4px 6px -1px rgba(0, 37, 58, 0.1);

/* Large shadow */
box-shadow: 0 10px 15px -3px rgba(0, 37, 58, 0.1);

/* Hover shadow (blue tint) */
box-shadow: 0 10px 20px rgba(5, 99, 137, 0.2);
```

## Animation & Transitions

### Standard Durations

- **Fast**: 150ms (micro-interactions)
- **Normal**: 300ms (standard transitions)
- **Slow**: 500ms (complex animations)

### Easing Functions

```css
/* Standard easing */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Enter easing */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Exit easing */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { 
    transform: translateY(10px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

/* Hover Lift */
@keyframes hoverLift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Usage                    |
|------------|-----------|--------------------------|
| xs         | 475px     | Large phones             |
| sm         | 640px     | Tablets (portrait)       |
| md         | 768px     | Tablets (landscape)      |
| lg         | 1024px    | Small laptops            |
| xl         | 1280px    | Desktops                 |
| 2xl        | 1536px    | Large desktops           |
| 3xl        | 1920px    | Ultra-wide monitors      |

## DaisyUI Theme Configuration

The design system includes custom DaisyUI themes:

- **unimore**: Light theme with Unimore colors
- **unimore-dark**: Dark theme variant
- **unimore-user**: User portal theme
- **unimore-user-dark**: User portal dark theme

### Using Themes

```tsx
// In your app layout
<html data-theme="unimore">
  {/* Your app content */}
</html>

// For dark mode
<html data-theme="unimore-dark">
  {/* Your app content */}
</html>
```

## Implementation Guidelines

### 1. Import Design Tokens

```typescript
import { designTokens } from '@mes/config';

// Use tokens in your components
const primaryColor = designTokens.colors.semantic.primary;
```

### 2. Use Tailwind Classes

```tsx
// Use Unimore color classes
<div className="bg-unimore-blue text-white">
  <h1 className="text-unimore-navy-dark">Title</h1>
</div>

// Use semantic classes
<button className="bg-primary hover:bg-primary-focus">
  Click Me
</button>
```

### 3. Maintain Consistency

- Always use design tokens instead of hardcoded values
- Follow the established color hierarchy
- Use the spacing system for all margins and padding
- Apply consistent shadow depths based on elevation

### 4. Accessibility

- Maintain WCAG AA color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation support

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Poppins Font](https://fonts.google.com/specimen/Poppins)
- [Manufacturing UI Patterns](https://www.manufacturing-ux.com/)

## Examples

### Dashboard Card

```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-unimore-gray-200">
  <div className="flex items-center justify-between mb-4">
    <Heading as="h3" size="xl" color="navy">
      Production Line A
    </Heading>
    <Badge status="running">Active</Badge>
  </div>
  <div className="space-y-2">
    <Text size="sm" color="muted">Current Output</Text>
    <Text size="2xl" weight="bold" color="blue">
      1,234 units/hr
    </Text>
  </div>
</div>
```

### Status Indicator

```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full bg-status-running animate-pulse" />
  <Text size="sm" weight="medium">
    Machine Running
  </Text>
</div>
```

### Navigation Header

```tsx
<header className="bg-unimore-navy text-white">
  <div className="container mx-auto px-4 py-3">
    <nav className="flex items-center justify-between">
      <Heading as="h1" size="2xl" color="inherit">
        MES Portal
      </Heading>
      <div className="flex gap-4">
        <Button variant="ghost">Dashboard</Button>
        <Button variant="ghost">Reports</Button>
        <Button variant="ghost">Settings</Button>
      </div>
    </nav>
  </div>
</header>
```