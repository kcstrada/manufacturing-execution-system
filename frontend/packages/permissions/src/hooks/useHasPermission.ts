import { usePermission } from './usePermission'
import { PermissionRelation, PermissionObject } from '../types/permissions.types'

export const useHasPermission = (
  relation: PermissionRelation,
  object: PermissionObject,
  skip?: boolean
): boolean => {
  const { hasPermission } = usePermission({
    relation,
    object,
    skip,
  })

  return hasPermission === true
}