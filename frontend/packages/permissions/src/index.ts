// Contexts
export { PermissionProvider, usePermissionContext } from './contexts/PermissionContext'
export type { PermissionProviderProps } from './contexts/PermissionContext'

// Hooks
export { usePermission } from './hooks/usePermission'
export type { UsePermissionResult } from './hooks/usePermission'
export { useHasPermission } from './hooks/useHasPermission'
export { useRole, useHasRole, useHasAnyRole, useHasAllRoles } from './hooks/useRole'

// Components
export {
  PermissionGate,
  CanView,
  CanEdit,
  RequireRole,
} from './components/PermissionGate'

// Higher-Order Components
export {
  withPermission,
  withRole,
  withViewPermission,
  withEditPermission,
} from './hoc/withPermission'
export type { WithPermissionOptions } from './hoc/withPermission'

// Utilities
export {
  createOrganizationObject,
  createOrderObject,
  createTaskObject,
  createProductObject,
  createInventoryObject,
  createEquipmentObject,
  createReportObject,
  parsePermissionObject,
  isViewerRelation,
  isEditorRelation,
  isOwnerRelation,
  isRoleRelation,
  getHigherPermissions,
  hasHigherPermission,
  getRolePermissions,
  canUserPerformAction,
  ROLE_PERMISSIONS,
} from './utils/permission.utils'

// Types
export type {
  PermissionCheckRequest,
  PermissionContext,
  PermissionRelation,
  PermissionObject,
  PermissionGateProps,
  UsePermissionOptions,
  UseRoleOptions,
} from './types/permissions.types'