import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta = {
  title: 'Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'ghost', 'info', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Success: Story = {
  args: {
    children: 'Active',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Pending',
    variant: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Failed',
    variant: 'error',
  },
}

export const WithDot: Story = {
  args: {
    children: 'Online',
    variant: 'success',
    dot: true,
  },
}

export const Outline: Story = {
  args: {
    children: 'Draft',
    variant: 'info',
    outline: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Badge size="xs">Extra Small</Badge>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

export const ManufacturingStatuses: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Badge variant="success">Running</Badge>
      <Badge variant="warning">Maintenance</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Idle</Badge>
      <Badge variant="primary">In Progress</Badge>
      <Badge variant="secondary">Scheduled</Badge>
    </div>
  ),
}