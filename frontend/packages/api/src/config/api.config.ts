export interface ApiConfig {
  baseURL: string
  timeout?: number
  withCredentials?: boolean
  headers?: Record<string, string>
}

export const defaultApiConfig: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}

export const apiEndpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // Order endpoints
  orders: {
    base: '/orders',
    byId: (id: string) => `/orders/${id}`,
    byStatus: (status: string) => `/orders?status=${status}`,
    workflow: (id: string) => `/orders/${id}/workflow`,
  },

  // Task endpoints
  tasks: {
    base: '/tasks',
    byId: (id: string) => `/tasks/${id}`,
    assign: (id: string) => `/tasks/${id}/assign`,
    split: (id: string) => `/tasks/${id}/split`,
    dependencies: (id: string) => `/tasks/${id}/dependencies`,
  },

  // Worker endpoints
  workers: {
    base: '/workers',
    byId: (id: string) => `/workers/${id}`,
    schedule: (id: string) => `/workers/${id}/schedule`,
    skills: (id: string) => `/workers/${id}/skills`,
    clockIn: '/workers/clock-in',
    clockOut: '/workers/clock-out',
  },

  // Inventory endpoints
  inventory: {
    base: '/inventory',
    byId: (id: string) => `/inventory/${id}`,
    stock: '/inventory/stock',
    movements: '/inventory/movements',
    forecast: '/inventory/forecast',
    alerts: '/inventory/alerts',
  },

  // Product endpoints
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`,
    bom: (id: string) => `/products/${id}/bom`,
    specifications: (id: string) => `/products/${id}/specifications`,
  },

  // Equipment endpoints
  equipment: {
    base: '/equipment',
    byId: (id: string) => `/equipment/${id}`,
    maintenance: (id: string) => `/equipment/${id}/maintenance`,
    schedule: (id: string) => `/equipment/${id}/schedule`,
    status: (id: string) => `/equipment/${id}/status`,
  },

  // Quality endpoints
  quality: {
    base: '/quality',
    metrics: '/quality/metrics',
    inspections: '/quality/inspections',
    controlPlans: '/quality/control-plans',
    ncrs: '/quality/ncrs',
  },

  // Shift endpoints
  shifts: {
    base: '/shifts',
    byId: (id: string) => `/shifts/${id}`,
    current: '/shifts/current',
    schedule: '/shifts/schedule',
  },

  // Reports endpoints
  reports: {
    base: '/reports',
    production: '/reports/production',
    quality: '/reports/quality',
    inventory: '/reports/inventory',
    worker: '/reports/worker',
    export: (type: string) => `/reports/export?type=${type}`,
  },

  // Notifications endpoints
  notifications: {
    base: '/notifications',
    unread: '/notifications/unread',
    markRead: (id: string) => `/notifications/${id}/read`,
    preferences: '/notifications/preferences',
  },

  // Waste endpoints
  waste: {
    base: '/waste',
    record: '/waste/record',
    byType: (type: string) => `/waste?type=${type}`,
    statistics: '/waste/statistics',
  },
}