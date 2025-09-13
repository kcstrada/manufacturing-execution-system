import React from 'react'
import {
  PermissionProvider,
  PermissionGate,
  CanView,
  CanEdit,
  RequireRole,
  usePermission,
  useHasPermission,
  useHasRole,
  createOrderObject,
  createTaskObject,
} from '@mes/permissions'
import { useAuth } from '@mes/auth'

/**
 * Example: Wrapping your app with PermissionProvider
 */
export function App() {
  const { user, token } = useAuth()

  return (
    <PermissionProvider
      apiUrl={process.env.NEXT_PUBLIC_OPENFGA_API_URL || 'http://localhost:8081'}
      storeId={process.env.NEXT_PUBLIC_OPENFGA_STORE_ID || ''}
      userId={user?.id || null}
      userRoles={user?.roles || []}
      token={token}
    >
      <Dashboard />
    </PermissionProvider>
  )
}

/**
 * Example: Using permission hooks in components
 */
function OrderCard({ orderId }: { orderId: string }) {
  const orderObject = createOrderObject(orderId)
  
  // Hook approach
  const { hasPermission, isLoading } = usePermission({
    relation: 'viewer',
    object: orderObject,
  })

  const canEdit = useHasPermission('editor', orderObject)

  if (isLoading) {
    return <div>Loading permissions...</div>
  }

  if (!hasPermission) {
    return <div>You don't have permission to view this order</div>
  }

  return (
    <div className="order-card">
      <h3>Order #{orderId}</h3>
      <p>Order details here...</p>
      
      {canEdit && (
        <button>Edit Order</button>
      )}
    </div>
  )
}

/**
 * Example: Using PermissionGate components
 */
function TaskManagement({ taskId }: { taskId: string }) {
  const taskObject = createTaskObject(taskId)

  return (
    <div>
      {/* View permission gate */}
      <CanView 
        object={taskObject}
        fallback={<div>No access to view this task</div>}
        loading={<div>Checking permissions...</div>}
      >
        <div className="task-details">
          <h3>Task Details</h3>
          <p>Task information here...</p>

          {/* Edit permission gate */}
          <CanEdit object={taskObject}>
            <button>Edit Task</button>
            <button>Reassign Task</button>
          </CanEdit>
        </div>
      </CanView>
    </div>
  )
}

/**
 * Example: Role-based access control
 */
function Dashboard() {
  const isAdmin = useHasRole('admin')
  const isWorker = useHasRole('worker')

  return (
    <div className="dashboard">
      <h1>Manufacturing Execution System</h1>

      {/* Public content */}
      <div className="public-section">
        <h2>Public Dashboard</h2>
        <p>Welcome to MES</p>
      </div>

      {/* Worker-only content */}
      <RequireRole role="worker">
        <div className="worker-section">
          <h2>My Tasks</h2>
          <TaskList />
        </div>
      </RequireRole>

      {/* Admin or Executive content */}
      <RequireRole 
        roles={['admin', 'executive']} 
        requireAll={false}
        fallback={<div>Management section - Access denied</div>}
      >
        <div className="management-section">
          <h2>Management Dashboard</h2>
          <SystemMetrics />
          <UserManagement />
        </div>
      </RequireRole>

      {/* Admin-only content */}
      {isAdmin && (
        <div className="admin-section">
          <h2>System Administration</h2>
          <SystemSettings />
        </div>
      )}
    </div>
  )
}

/**
 * Example: Complex permission logic
 */
function OrderActions({ orderId }: { orderId: string }) {
  const orderObject = createOrderObject(orderId)
  
  const viewPermission = usePermission({
    relation: 'viewer',
    object: orderObject,
  })

  const editPermission = usePermission({
    relation: 'editor',
    object: orderObject,
  })

  const isExecutive = useHasRole('executive')
  const isSales = useHasRole('sales')

  // Complex permission logic
  const canApprove = editPermission.hasPermission && (isExecutive || isSales)
  const canDelete = editPermission.hasPermission && isExecutive
  const canView = viewPermission.hasPermission

  return (
    <div className="order-actions">
      {canView && (
        <button>View Order</button>
      )}
      
      {editPermission.hasPermission && (
        <button>Edit Order</button>
      )}
      
      {canApprove && (
        <button>Approve Order</button>
      )}
      
      {canDelete && (
        <button className="danger">Delete Order</button>
      )}
    </div>
  )
}

/**
 * Example: Using PermissionGate with multiple conditions
 */
function RestrictedFeature() {
  return (
    <PermissionGate
      relation="editor"
      object="organization:current"
      role="executive"
      fallback={
        <div className="alert alert-warning">
          You need both editor permissions and executive role to access this feature.
        </div>
      }
      loading={<div>Verifying access...</div>}
    >
      <div className="restricted-feature">
        <h2>Executive Editor Panel</h2>
        <p>This content requires both permissions and role</p>
      </div>
    </PermissionGate>
  )
}

// Placeholder components for the example
const TaskList = () => <div>Task list...</div>
const SystemMetrics = () => <div>System metrics...</div>
const UserManagement = () => <div>User management...</div>
const SystemSettings = () => <div>System settings...</div>

export default {
  App,
  OrderCard,
  TaskManagement,
  Dashboard,
  OrderActions,
  RestrictedFeature,
}