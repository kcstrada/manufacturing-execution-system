# @mes/ui

A comprehensive shared UI component library for the Manufacturing Execution System (MES), built with React, TypeScript, and DaisyUI.

## Installation

This package is used internally within the MES monorepo. Both admin and user portals can import components using:

```typescript
import { Button, Card, ProductionCard } from '@mes/ui';
```

## Components

### Layout Components

- **Header** - Application header with title and actions
- **Footer** - Application footer with links and copyright
- **Sidebar** - Collapsible sidebar navigation
- **Container** - Responsive container with padding controls

### Navigation Components

- **Navbar** - Main navigation bar with brand and menu items
- **Breadcrumb** - Breadcrumb navigation trail
- **TabNav** - Tab navigation with badges and states

### Data Display Components

- **Table** - Feature-rich data table with sorting and actions
- **Card** - Flexible card component with variants
- **Badge** - Status badges with multiple variants
- **Status** - Status indicators with dot and label

### Form Components

- **Input** - Text input with validation and icons
- **Select** - Dropdown select with options
- **Button** - Button component with variants and loading states
- **Form** - Form wrapper with spacing controls
- **FormGroup** - Form section grouping

### Feedback Components

- **Alert** - Alert messages with variants and dismissal
- **Toast** - Toast notifications with actions
- **Modal** - Modal dialogs with customizable sizes
- **Loading** - Loading spinners and skeleton components

### Manufacturing Components

- **ProductionCard** - Production line status and metrics
- **EquipmentStatus** - Equipment status with real-time metrics
- **MetricsCard** - Key performance indicator cards
- **ShiftIndicator** - Current and next shift information

## Hooks

- **useTheme** - Theme management (light/dark/auto)
- **useToast** - Toast notification management
- **useModal** - Modal state management

## Utilities

- **cn** - ClassName merging utility using clsx
- **mergeClasses** - Merge default and custom classes
- **conditionalClasses** - Apply classes based on conditions
- **variantClasses** - Handle variant-based class mapping

## Usage Examples

### Basic Components

```typescript
import { Button, Card, Input } from '@mes/ui';

function MyComponent() {
  return (
    <Card title="Production Status">
      <Input 
        label="Product Name" 
        placeholder="Enter product name"
      />
      <Button variant="primary">
        Start Production
      </Button>
    </Card>
  );
}
```

### Manufacturing Components

```typescript
import { ProductionCard, EquipmentStatus, MetricsCard } from '@mes/ui';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ProductionCard
        title="Line A"
        productName="Widget X"
        currentQuantity={750}
        targetQuantity={1000}
        status="running"
        progress={75}
      />
      <EquipmentStatus
        equipmentId="EQ-001"
        equipmentName="CNC Machine"
        status="online"
        metrics={[
          { label: 'Temperature', value: 65, unit: '°C' },
          { label: 'Speed', value: 1200, unit: 'rpm' }
        ]}
      />
      <MetricsCard
        title="Daily Output"
        value={1250}
        unit="units"
        variant="success"
        change={{ value: 12, direction: 'up', period: 'vs yesterday' }}
      />
    </div>
  );
}
```

### Using Hooks

```typescript
import { useTheme, useToast, useModal } from '@mes/ui';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();

  const handleAction = () => {
    showToast({
      message: 'Action completed successfully!',
      variant: 'success'
    });
  };

  return (
    <div>
      <button onClick={toggleTheme}>
        Current theme: {theme}
      </button>
      <button onClick={() => openModal({ data: 'example' })}>
        Open Modal
      </button>
    </div>
  );
}
```

## Styling

This library uses DaisyUI for styling, which provides a comprehensive set of utility classes built on top of Tailwind CSS. All components are designed to work seamlessly with the MES design system.

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Development mode
npm run dev
```

## License

MIT