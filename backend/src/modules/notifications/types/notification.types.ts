export enum NotificationType {
  // Order notifications
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_DELAYED = 'order.delayed',
  
  // Inventory notifications
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',
  INVENTORY_RECEIVED = 'inventory.received',
  INVENTORY_EXPIRED = 'inventory.expired',
  INVENTORY_REORDER = 'inventory.reorder',
  
  // Production notifications
  PRODUCTION_STARTED = 'production.started',
  PRODUCTION_COMPLETED = 'production.completed',
  PRODUCTION_DELAYED = 'production.delayed',
  PRODUCTION_ERROR = 'production.error',
  
  // Task notifications
  TASK_ASSIGNED = 'task.assigned',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_OVERDUE = 'task.overdue',
  
  // Quality notifications
  QUALITY_ALERT = 'quality.alert',
  QUALITY_INSPECTION_FAILED = 'quality.inspection_failed',
  QUALITY_NCR_CREATED = 'quality.ncr_created',
  QUALITY_NCR_RESOLVED = 'quality.ncr_resolved',
  
  // Maintenance notifications
  MAINTENANCE_DUE = 'maintenance.due',
  MAINTENANCE_SCHEDULED = 'maintenance.scheduled',
  MAINTENANCE_COMPLETED = 'maintenance.completed',
  EQUIPMENT_BREAKDOWN = 'equipment.breakdown',
  
  // System notifications
  SYSTEM_ALERT = 'system.alert',
  SYSTEM_UPDATE = 'system.update',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_ERROR = 'system.error',
  
  // User notifications
  USER_WELCOME = 'user.welcome',
  USER_PASSWORD_RESET = 'user.password_reset',
  USER_ACCOUNT_LOCKED = 'user.account_locked',
  USER_ROLE_CHANGED = 'user.role_changed',
  
  // Custom notifications
  CUSTOM = 'custom',
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  WEBSOCKET = 'websocket',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ACKNOWLEDGED = 'acknowledged',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface NotificationPayload {
  tenantId: string;
  userId?: string;
  userIds?: string[];
  roles?: string[];
  type: NotificationType;
  channel?: NotificationChannel | NotificationChannel[];
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  metadata?: {
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    iconUrl?: string;
    category?: string;
    tags?: string[];
  };
  templateId?: string;
  templateData?: Record<string, any>;
  groupId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
    data?: any;
  }>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error?: string;
  deliveredAt?: Date;
}

export interface NotificationBatchResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  results: NotificationResult[];
}

export interface NotificationFilter {
  tenantId?: string;
  userId?: string;
  type?: NotificationType | NotificationType[];
  channel?: NotificationChannel | NotificationChannel[];
  status?: NotificationStatus | NotificationStatus[];
  priority?: NotificationPriority | NotificationPriority[];
  read?: boolean;
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
  groupId?: string;
  search?: string;
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
}