// Base types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string
  updatedBy?: string
  tenantId: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiErrorResponse {
  message: string
  statusCode: number
  error?: string
  details?: any
}

// User & Auth types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
  roles: string[]
  tenantId: string
  isActive: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  QUALITY_CHECK = 'QUALITY_CHECK',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Order extends BaseEntity {
  orderNumber: string
  customerId: string
  customerName: string
  status: OrderStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: Date
  items: OrderItem[]
  totalAmount: number
  notes?: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specifications?: Record<string, any>
}

// Task types
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export interface Task extends BaseEntity {
  title: string
  description: string
  status: TaskStatus
  priority: number
  orderId?: string
  assignedToId?: string
  assignedTo?: Worker
  dueDate: Date
  startedAt?: Date
  completedAt?: Date
  estimatedHours: number
  actualHours?: number
  dependencies: string[]
  skills: string[]
}

// Worker types
export interface Worker extends BaseEntity {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  skills: Skill[]
  shiftId?: string
  isActive: boolean
  productivity?: number
}

export interface Skill {
  id: string
  name: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  certifiedAt?: Date
}

export interface TimeClockEntry {
  id: string
  workerId: string
  clockIn: Date
  clockOut?: Date
  shiftId: string
  hoursWorked?: number
  breakMinutes?: number
}

// Inventory types
export interface InventoryItem extends BaseEntity {
  sku: string
  name: string
  description: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  location: string
  cost: number
  lastRestockedAt?: Date
}

export interface StockMovement {
  id: string
  itemId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason: string
  reference?: string
  performedBy: string
  performedAt: Date
}

// Product types
export interface Product extends BaseEntity {
  productCode: string
  name: string
  description: string
  category: string
  specifications: Record<string, any>
  bomItems: BOMItem[]
  price: number
  unit: string
  leadTime: number
  isActive: boolean
}

export interface BOMItem {
  id: string
  materialId: string
  materialName: string
  quantity: number
  unit: string
}

// Equipment types
export enum EquipmentStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  IDLE = 'IDLE',
}

export interface Equipment extends BaseEntity {
  equipmentCode: string
  name: string
  type: string
  manufacturer: string
  model: string
  serialNumber: string
  status: EquipmentStatus
  location: string
  purchaseDate: Date
  warrantyExpiry?: Date
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  operatingHours: number
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE'
  description: string
  performedBy: string
  performedAt: Date
  duration: number
  cost: number
  parts: string[]
  nextScheduledDate?: Date
}

// Quality types
export interface QualityMetric extends BaseEntity {
  name: string
  value: number
  unit: string
  target: number
  lowerLimit?: number
  upperLimit?: number
  category: string
  measuredAt: Date
  productId?: string
  orderId?: string
  workerId?: string
}

export interface QualityInspection {
  id: string
  type: 'INCOMING' | 'IN_PROCESS' | 'FINAL'
  productId: string
  orderId?: string
  inspectorId: string
  inspectedAt: Date
  result: 'PASS' | 'FAIL' | 'CONDITIONAL'
  defects: Defect[]
  notes?: string
}

export interface Defect {
  id: string
  type: string
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL'
  quantity: number
  description: string
  correctionAction?: string
}

// Shift types
export interface Shift extends BaseEntity {
  name: string
  startTime: string
  endTime: string
  days: string[]
  isActive: boolean
  breakMinutes: number
}

export interface ShiftSchedule {
  id: string
  shiftId: string
  workerId: string
  date: Date
  isConfirmed: boolean
  actualStart?: Date
  actualEnd?: Date
}

// Report types
export interface ProductionReport {
  period: {
    start: Date
    end: Date
  }
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalUnitsProduced: number
  efficiency: number
  productivity: number
  oee: number // Overall Equipment Effectiveness
}

export interface QualityReport {
  period: {
    start: Date
    end: Date
  }
  totalInspections: number
  passRate: number
  defectRate: number
  topDefects: Array<{
    type: string
    count: number
    percentage: number
  }>
  reworkRate: number
  scrapRate: number
}

// Notification types
export interface Notification extends BaseEntity {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  category: string
  title: string
  message: string
  userId: string
  isRead: boolean
  readAt?: Date
  data?: Record<string, any>
}

// Waste types
export interface WasteRecord extends BaseEntity {
  type: 'SCRAP' | 'REWORK' | 'DEFECT'
  productId?: string
  orderId?: string
  quantity: number
  unit: string
  reason: string
  cost: number
  reportedBy: string
  reportedAt: Date
  correctionAction?: string
}