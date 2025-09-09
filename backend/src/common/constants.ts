/**
 * Application-wide constants
 */

// Request context constants
export const REQUEST_CONTEXT = 'REQUEST_CONTEXT';
export const REQUEST_ID = 'REQUEST_ID';
export const TENANT_ID = 'TENANT_ID';
export const USER_ID = 'USER_ID';

// Cache keys
export const CACHE_PREFIX = 'mes:';
export const CACHE_TTL = 3600; // 1 hour default TTL

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Rate limiting
export const RATE_LIMIT_TTL = 60; // 1 minute
export const RATE_LIMIT_MAX = 100; // 100 requests per minute

// Queue names
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  INVENTORY_SYNC: 'inventory-sync',
  ORDER_PROCESSING: 'order-processing',
  TASK_ASSIGNMENT: 'task-assignment',
} as const;

// WebSocket events
export const WS_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_COMPLETED: 'order:completed',
  TASK_ASSIGNED: 'task:assigned',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  INVENTORY_LOW: 'inventory:low',
  EQUIPMENT_MAINTENANCE: 'equipment:maintenance',
  QUALITY_ALERT: 'quality:alert',
} as const;

// System roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EXECUTIVE: 'executive',
  SALES: 'sales',
  WORKER: 'worker',
  VIEWER: 'viewer',
} as const;

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  QUALITY_CHECK: 'quality_check',
  COMPLETED: 'completed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Task status
export const TASK_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// Equipment status
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  RETIRED: 'retired',
} as const;