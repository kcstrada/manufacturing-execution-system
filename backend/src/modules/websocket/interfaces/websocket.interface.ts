export enum WebSocketEvent {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_STATUS_CHANGED = 'order.status.changed',
  ORDER_COMPLETED = 'order.completed',

  // Task events
  TASK_CREATED = 'task.created',
  TASK_ASSIGNED = 'task.assigned',
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_UPDATED = 'task.updated',

  // Inventory events
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',
  INVENTORY_RECEIVED = 'inventory.received',
  INVENTORY_CONSUMED = 'inventory.consumed',
  INVENTORY_ADJUSTED = 'inventory.adjusted',

  // Production events
  PRODUCTION_STARTED = 'production.started',
  PRODUCTION_COMPLETED = 'production.completed',
  PRODUCTION_DELAYED = 'production.delayed',
  PRODUCTION_ALERT = 'production.alert',

  // Quality events
  QUALITY_INSPECTION_CREATED = 'quality.inspection.created',
  QUALITY_INSPECTION_COMPLETED = 'quality.inspection.completed',
  QUALITY_NCR_CREATED = 'quality.ncr.created',
  QUALITY_ALERT = 'quality.alert',

  // Equipment events
  EQUIPMENT_STATUS_CHANGED = 'equipment.status.changed',
  EQUIPMENT_MAINTENANCE_DUE = 'equipment.maintenance.due',
  EQUIPMENT_BREAKDOWN = 'equipment.breakdown',
  EQUIPMENT_ALERT = 'equipment.alert',

  // Worker events
  WORKER_CLOCKED_IN = 'worker.clocked_in',
  WORKER_CLOCKED_OUT = 'worker.clocked_out',
  WORKER_TASK_ASSIGNED = 'worker.task_assigned',
  WORKER_SHIFT_CHANGED = 'worker.shift_changed',

  // System events
  SYSTEM_NOTIFICATION = 'system.notification',
  SYSTEM_ALERT = 'system.alert',
  SYSTEM_BROADCAST = 'system.broadcast',

  // Metrics events
  METRICS_UPDATE = 'metrics.update',
  KPI_UPDATE = 'kpi.update',
  DASHBOARD_UPDATE = 'dashboard.update',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
  tenantId: string;
  userId?: string;
  correlationId?: string;
}

export interface WebSocketRoom {
  name: string;
  type: RoomType;
  tenantId: string;
  members: Set<string>;
  metadata?: Record<string, any>;
}

export enum RoomType {
  TENANT = 'tenant',
  DEPARTMENT = 'department',
  WORK_CENTER = 'work_center',
  USER = 'user',
  ROLE = 'role',
  BROADCAST = 'broadcast',
}

export interface WebSocketClient {
  id: string;
  userId: string;
  tenantId: string;
  roles: string[];
  connectedAt: Date;
  rooms: Set<string>;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  data?: any;
  actions?: NotificationAction[];
}

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  TASK = 'task',
  ORDER = 'order',
  INVENTORY = 'inventory',
  QUALITY = 'quality',
  EQUIPMENT = 'equipment',
}

export enum NotificationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface NotificationAction {
  label: string;
  action: string;
  data?: any;
}

export interface BroadcastOptions {
  rooms?: string[];
  roles?: string[];
  userIds?: string[];
  excludeUserIds?: string[];
  tenantId?: string;
}

export interface WebSocketAuthPayload {
  token: string;
  tenantId: string;
}

export interface WebSocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
