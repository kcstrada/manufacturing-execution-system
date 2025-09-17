/**
 * Interface for entities that support audit tracking
 */
export interface IAuditable {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface for multi-tenant entities
 */
export interface ITenantScoped {
  tenantId: string;
}

/**
 * Interface for entities with detailed audit logging
 */
export interface IAuditLog {
  auditAction?: string;
  auditChanges?: Record<string, any>;
  auditReason?: string;
  auditTimestamp?: Date;
}

/**
 * Audit action types
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  ARCHIVE = 'ARCHIVE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

/**
 * Type for tracking field changes
 */
export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  changedAt: Date;
  changedBy: string;
}

/**
 * Context for audit operations
 */
export interface AuditContext {
  userId: string;
  tenantId?: string;
  action: AuditAction;
  reason?: string;
  metadata?: Record<string, any>;
}
