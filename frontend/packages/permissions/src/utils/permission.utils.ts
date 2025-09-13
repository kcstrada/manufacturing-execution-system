import { PermissionRelation, PermissionObject } from '../types/permissions.types'

export const createOrganizationObject = (orgId: string): PermissionObject => {
  return `organization:${orgId}`
}

export const createOrderObject = (orderId: string): PermissionObject => {
  return `order:${orderId}`
}

export const createTaskObject = (taskId: string): PermissionObject => {
  return `task:${taskId}`
}

export const createProductObject = (productId: string): PermissionObject => {
  return `product:${productId}`
}

export const createInventoryObject = (inventoryId: string): PermissionObject => {
  return `inventory:${inventoryId}`
}

export const createEquipmentObject = (equipmentId: string): PermissionObject => {
  return `equipment:${equipmentId}`
}

export const createReportObject = (reportId: string): PermissionObject => {
  return `report:${reportId}`
}

export const parsePermissionObject = (object: PermissionObject): { type: string; id: string } => {
  const [type, id] = object.split(':')
  return { type, id }
}

export const isViewerRelation = (relation: PermissionRelation): boolean => {
  return relation === 'viewer'
}

export const isEditorRelation = (relation: PermissionRelation): boolean => {
  return relation === 'editor'
}

export const isOwnerRelation = (relation: PermissionRelation): boolean => {
  return relation === 'owner'
}

export const isRoleRelation = (relation: PermissionRelation): boolean => {
  return ['owner', 'executive', 'sales', 'worker'].includes(relation)
}

export const getHigherPermissions = (relation: PermissionRelation): PermissionRelation[] => {
  const hierarchy: Record<PermissionRelation, PermissionRelation[]> = {
    viewer: ['editor', 'creator', 'assigned', 'owner', 'executive'],
    editor: ['creator', 'assigned', 'owner', 'executive'],
    creator: ['owner', 'executive'],
    assigned: ['owner', 'executive'],
    owner: [],
    executive: ['owner'],
    sales: ['executive', 'owner'],
    worker: ['sales', 'executive', 'owner'],
  }

  return hierarchy[relation] || []
}

export const hasHigherPermission = (
  userRelation: PermissionRelation,
  requiredRelation: PermissionRelation
): boolean => {
  if (userRelation === requiredRelation) {
    return true
  }

  const higherPermissions = getHigherPermissions(requiredRelation)
  return higherPermissions.includes(userRelation)
}

export const ROLE_PERMISSIONS: Record<string, PermissionRelation[]> = {
  admin: ['owner', 'executive', 'editor', 'viewer'],
  executive: ['executive', 'editor', 'viewer'],
  sales: ['sales', 'editor', 'viewer'],
  worker: ['worker', 'viewer'],
}

export const getRolePermissions = (role: string): PermissionRelation[] => {
  return ROLE_PERMISSIONS[role.toLowerCase()] || ['viewer']
}

export const canUserPerformAction = (
  userRoles: string[],
  requiredRelation: PermissionRelation
): boolean => {
  for (const role of userRoles) {
    const permissions = getRolePermissions(role)
    if (permissions.includes(requiredRelation)) {
      return true
    }
  }
  return false
}