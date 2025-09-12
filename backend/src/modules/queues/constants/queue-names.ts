export const QUEUE_NAMES = {
  // Core manufacturing queues
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  PRODUCTION: 'production',
  QUALITY: 'quality',
  MAINTENANCE: 'maintenance',
  
  // Communication queues
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  
  // Reporting and analytics
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  
  // System queues
  DATA_SYNC: 'data-sync',
  CLEANUP: 'cleanup',
  BACKUP: 'backup',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  // Order jobs
  PROCESS_ORDER: 'process-order',
  UPDATE_ORDER_STATUS: 'update-order-status',
  CALCULATE_ORDER_METRICS: 'calculate-order-metrics',
  CHECK_ORDER_DELAYS: 'check-order-delays',
  
  // Inventory jobs
  CHECK_STOCK_LEVELS: 'check-stock-levels',
  REORDER_MATERIALS: 'reorder-materials',
  UPDATE_INVENTORY_FORECAST: 'update-inventory-forecast',
  SYNC_INVENTORY: 'sync-inventory',
  
  // Production jobs
  SCHEDULE_PRODUCTION: 'schedule-production',
  UPDATE_PRODUCTION_STATUS: 'update-production-status',
  CALCULATE_OEE: 'calculate-oee',
  OPTIMIZE_WORKFLOW: 'optimize-workflow',
  
  // Quality jobs
  PROCESS_INSPECTION: 'process-inspection',
  GENERATE_QUALITY_REPORT: 'generate-quality-report',
  CHECK_QUALITY_ALERTS: 'check-quality-alerts',
  CALCULATE_QUALITY_METRICS: 'calculate-quality-metrics',
  
  // Maintenance jobs
  SCHEDULE_MAINTENANCE: 'schedule-maintenance',
  CHECK_MAINTENANCE_DUE: 'check-maintenance-due',
  UPDATE_EQUIPMENT_STATUS: 'update-equipment-status',
  SEND_MAINTENANCE_ALERTS: 'send-maintenance-alerts',
  
  // Notification jobs
  SEND_EMAIL: 'send-email',
  SEND_PUSH_NOTIFICATION: 'send-push-notification',
  SEND_SMS: 'send-sms',
  BROADCAST_NOTIFICATION: 'broadcast-notification',
  
  // Report jobs
  GENERATE_DAILY_REPORT: 'generate-daily-report',
  GENERATE_WEEKLY_REPORT: 'generate-weekly-report',
  GENERATE_MONTHLY_REPORT: 'generate-monthly-report',
  GENERATE_CUSTOM_REPORT: 'generate-custom-report',
  EXPORT_DATA: 'export-data',
  
  // Analytics jobs
  CALCULATE_KPI: 'calculate-kpi',
  UPDATE_DASHBOARD: 'update-dashboard',
  ANALYZE_TRENDS: 'analyze-trends',
  
  // System jobs
  CLEANUP_OLD_DATA: 'cleanup-old-data',
  BACKUP_DATABASE: 'backup-database',
  SYNC_EXTERNAL_SYSTEMS: 'sync-external-systems',
  HEALTH_CHECK: 'health-check',
} as const;

export type JobName = typeof JOB_NAMES[keyof typeof JOB_NAMES];