# @mes/permissions

Permission-based rendering hooks and components for the Manufacturing Execution System.

## Installation

This package is part of the MES monorepo and is automatically available to other packages and applications within the workspace.

```json
{
  "dependencies": {
    "@mes/permissions": "workspace:*"
  }
}
```

## Setup

Wrap your application with the `PermissionProvider`:

```tsx
import { PermissionProvider } from '@mes/permissions'
import { useAuth } from '@mes/auth'

function App() {
  const { user, token } = useAuth()

  return (
    <PermissionProvider
      apiUrl={process.env.NEXT_PUBLIC_OPENFGA_API_URL}
      storeId={process.env.NEXT_PUBLIC_OPENFGA_STORE_ID}
      userId={user?.id}
      userRoles={user?.roles}
      token={token}
    >
      {/* Your app components */}
    </PermissionProvider>
  )
}
```

## Usage

### Hooks

#### usePermission

Check permissions and get detailed status:

```tsx
import { usePermission } from '@mes/permissions'

function OrderDetails({ orderId }) {
  const { hasPermission, isLoading, error } = usePermission({
    relation: 'viewer',
    object: `order:${orderId}`,
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!hasPermission) return <AccessDenied />

  return <OrderContent />
}
```

#### useHasPermission

Simple boolean check for permissions:

```tsx
import { useHasPermission } from '@mes/permissions'

function OrderActions({ orderId }) {
  const canEdit = useHasPermission('editor', `order:${orderId}`)

  return (
    <div>
      <button>View Order</button>
      {canEdit && <button>Edit Order</button>}
    </div>
  )
}
```

#### useRole

Check user roles:

```tsx
import { useRole, useHasRole, useHasAnyRole } from '@mes/permissions'

function AdminPanel() {
  const isAdmin = useHasRole('admin')
  const isManager = useHasAnyRole(['executive', 'sales'])
  const hasFullAccess = useRole({
    roles: ['admin', 'executive'],
    requireAll: true,
  })

  if (!isAdmin) return null

  return <AdminContent />
}
```

### Components

#### PermissionGate

Conditionally render components based on permissions:

```tsx
import { PermissionGate } from '@mes/permissions'

function OrderManagement({ orderId }) {
  return (
    <PermissionGate
      relation="editor"
      object={`order:${orderId}`}
      fallback={<ReadOnlyView />}
      loading={<Spinner />}
    >
      <EditableOrderForm />
    </PermissionGate>
  )
}
```

#### CanView and CanEdit

Simplified permission gates:

```tsx
import { CanView, CanEdit } from '@mes/permissions'

function TaskCard({ taskId }) {
  return (
    <CanView object={`task:${taskId}`} fallback={<AccessDenied />}>
      <Card>
        <TaskDetails />
        <CanEdit object={`task:${taskId}`}>
          <EditButton />
        </CanEdit>
      </Card>
    </CanView>
  )
}
```

#### RequireRole

Role-based conditional rendering:

```tsx
import { RequireRole } from '@mes/permissions'

function Dashboard() {
  return (
    <div>
      <PublicDashboard />
      
      <RequireRole role="worker">
        <WorkerDashboard />
      </RequireRole>

      <RequireRole roles={['admin', 'executive']} requireAll={false}>
        <ManagementDashboard />
      </RequireRole>
    </div>
  )
}
```

### Higher-Order Components

#### withPermission

Wrap components with permission checks:

```tsx
import { withPermission } from '@mes/permissions'

const ProtectedComponent = withPermission(
  MyComponent,
  {
    relation: 'editor',
    object: 'order:123',
    fallback: <AccessDenied />,
  }
)
```

#### withRole

Wrap components with role checks:

```tsx
import { withRole } from '@mes/permissions'

const AdminOnlyComponent = withRole(
  MyAdminComponent,
  'admin',
  {
    fallback: <NotAuthorized />,
  }
)
```

### Utility Functions

#### Object Creation Helpers

```tsx
import {
  createOrderObject,
  createTaskObject,
  createOrganizationObject,
} from '@mes/permissions'

const orderObj = createOrderObject('123') // 'order:123'
const taskObj = createTaskObject('456') // 'task:456'
const orgObj = createOrganizationObject('789') // 'organization:789'
```

#### Permission Hierarchy

```tsx
import {
  hasHigherPermission,
  getHigherPermissions,
  canUserPerformAction,
} from '@mes/permissions'

// Check if 'owner' has higher permission than 'viewer'
const canOverride = hasHigherPermission('owner', 'viewer') // true

// Get all permissions higher than 'editor'
const higher = getHigherPermissions('editor') // ['creator', 'assigned', 'owner', 'executive']

// Check if user roles allow an action
const canEdit = canUserPerformAction(['sales'], 'editor') // true
```

## Permission Relations

The following relations are supported:

- `viewer` - Can view the resource
- `editor` - Can edit the resource
- `creator` - Created the resource
- `assigned` - Assigned to the resource
- `owner` - Organization owner
- `executive` - Executive role
- `sales` - Sales role
- `worker` - Worker role

## Permission Objects

Permission objects follow the format `type:id`:

- `organization:${id}` - Organization resources
- `order:${id}` - Order resources
- `task:${id}` - Task resources
- `product:${id}` - Product resources
- `inventory:${id}` - Inventory resources
- `equipment:${id}` - Equipment resources
- `report:${id}` - Report resources

## Testing

The package includes comprehensive tests for all hooks and components:

```bash
npm test
```

## TypeScript Support

This package is fully typed and exports all necessary TypeScript definitions.