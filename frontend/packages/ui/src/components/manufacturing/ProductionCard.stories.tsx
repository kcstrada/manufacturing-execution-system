import type { Meta, StoryObj } from '@storybook/react'
import { ProductionCard } from './ProductionCard'

const meta = {
  title: 'Manufacturing/ProductionCard',
  component: ProductionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'running', 'maintenance', 'error'],
    },
  },
} satisfies Meta<typeof ProductionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Running: Story = {
  args: {
    lineId: 'LINE-001',
    lineName: 'Assembly Line A',
    status: 'running',
    currentProduct: 'Product XYZ',
    progress: 75,
    unitsProduced: 150,
    targetUnits: 200,
    efficiency: 92.5,
    operator: 'John Doe',
  },
}

export const Idle: Story = {
  args: {
    lineId: 'LINE-002',
    lineName: 'Packaging Line B',
    status: 'idle',
    progress: 0,
    unitsProduced: 0,
    targetUnits: 100,
    efficiency: 0,
  },
}

export const Maintenance: Story = {
  args: {
    lineId: 'LINE-003',
    lineName: 'Quality Control Station',
    status: 'maintenance',
    currentProduct: 'Product ABC',
    progress: 45,
    unitsProduced: 90,
    targetUnits: 200,
    efficiency: 85,
    operator: 'Jane Smith',
    nextMaintenance: '2024-12-15T14:00:00',
  },
}

export const Error: Story = {
  args: {
    lineId: 'LINE-004',
    lineName: 'Welding Station C',
    status: 'error',
    currentProduct: 'Component 123',
    progress: 60,
    unitsProduced: 120,
    targetUnits: 200,
    efficiency: 78.5,
    operator: 'Mike Johnson',
    errorMessage: 'Temperature sensor malfunction',
  },
}