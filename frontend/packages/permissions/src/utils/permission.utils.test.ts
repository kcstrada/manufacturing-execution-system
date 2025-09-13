import {
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
} from './permission.utils'

describe('Permission Utils', () => {
  describe('Object creation functions', () => {
    it('should create organization object', () => {
      expect(createOrganizationObject('org123')).toBe('organization:org123')
    })

    it('should create order object', () => {
      expect(createOrderObject('order456')).toBe('order:order456')
    })

    it('should create task object', () => {
      expect(createTaskObject('task789')).toBe('task:task789')
    })

    it('should create product object', () => {
      expect(createProductObject('prod123')).toBe('product:prod123')
    })

    it('should create inventory object', () => {
      expect(createInventoryObject('inv456')).toBe('inventory:inv456')
    })

    it('should create equipment object', () => {
      expect(createEquipmentObject('equip789')).toBe('equipment:equip789')
    })

    it('should create report object', () => {
      expect(createReportObject('report123')).toBe('report:report123')
    })
  })

  describe('parsePermissionObject', () => {
    it('should parse permission object correctly', () => {
      const result = parsePermissionObject('order:123')
      expect(result).toEqual({ type: 'order', id: '123' })
    })

    it('should handle complex IDs', () => {
      const result = parsePermissionObject('organization:tenant-456-abc')
      expect(result).toEqual({ type: 'organization', id: 'tenant-456-abc' })
    })
  })

  describe('Relation type checks', () => {
    it('should identify viewer relation', () => {
      expect(isViewerRelation('viewer')).toBe(true)
      expect(isViewerRelation('editor')).toBe(false)
    })

    it('should identify editor relation', () => {
      expect(isEditorRelation('editor')).toBe(true)
      expect(isEditorRelation('viewer')).toBe(false)
    })

    it('should identify owner relation', () => {
      expect(isOwnerRelation('owner')).toBe(true)
      expect(isOwnerRelation('worker')).toBe(false)
    })

    it('should identify role relations', () => {
      expect(isRoleRelation('owner')).toBe(true)
      expect(isRoleRelation('executive')).toBe(true)
      expect(isRoleRelation('sales')).toBe(true)
      expect(isRoleRelation('worker')).toBe(true)
      expect(isRoleRelation('viewer')).toBe(false)
      expect(isRoleRelation('editor')).toBe(false)
    })
  })

  describe('Permission hierarchy', () => {
    it('should get higher permissions for viewer', () => {
      const higher = getHigherPermissions('viewer')
      expect(higher).toContain('editor')
      expect(higher).toContain('owner')
      expect(higher).toContain('executive')
    })

    it('should get higher permissions for editor', () => {
      const higher = getHigherPermissions('editor')
      expect(higher).toContain('owner')
      expect(higher).toContain('executive')
      expect(higher).not.toContain('viewer')
    })

    it('should return empty array for owner', () => {
      const higher = getHigherPermissions('owner')
      expect(higher).toEqual([])
    })

    it('should check if user has higher permission', () => {
      expect(hasHigherPermission('owner', 'viewer')).toBe(true)
      expect(hasHigherPermission('executive', 'editor')).toBe(true)
      expect(hasHigherPermission('viewer', 'editor')).toBe(false)
      expect(hasHigherPermission('editor', 'editor')).toBe(true)
    })
  })

  describe('Role permissions', () => {
    it('should get permissions for admin role', () => {
      const perms = getRolePermissions('admin')
      expect(perms).toContain('owner')
      expect(perms).toContain('executive')
      expect(perms).toContain('editor')
      expect(perms).toContain('viewer')
    })

    it('should get permissions for executive role', () => {
      const perms = getRolePermissions('executive')
      expect(perms).toContain('executive')
      expect(perms).toContain('editor')
      expect(perms).toContain('viewer')
      expect(perms).not.toContain('owner')
    })

    it('should get permissions for sales role', () => {
      const perms = getRolePermissions('sales')
      expect(perms).toContain('sales')
      expect(perms).toContain('editor')
      expect(perms).toContain('viewer')
    })

    it('should get permissions for worker role', () => {
      const perms = getRolePermissions('worker')
      expect(perms).toContain('worker')
      expect(perms).toContain('viewer')
      expect(perms).not.toContain('editor')
    })

    it('should default to viewer for unknown roles', () => {
      const perms = getRolePermissions('unknown')
      expect(perms).toEqual(['viewer'])
    })
  })

  describe('canUserPerformAction', () => {
    it('should allow admin to perform owner actions', () => {
      expect(canUserPerformAction(['admin'], 'owner')).toBe(true)
    })

    it('should allow executive to perform editor actions', () => {
      expect(canUserPerformAction(['executive'], 'editor')).toBe(true)
    })

    it('should not allow worker to perform editor actions', () => {
      expect(canUserPerformAction(['worker'], 'editor')).toBe(false)
    })

    it('should check multiple roles', () => {
      expect(canUserPerformAction(['worker', 'sales'], 'editor')).toBe(true)
    })

    it('should handle empty roles', () => {
      expect(canUserPerformAction([], 'viewer')).toBe(false)
    })
  })
})