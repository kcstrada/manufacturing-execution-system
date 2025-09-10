import { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';

/**
 * Base service interface providing common CRUD operations
 * All domain services should extend this interface
 */
export interface IBaseService<T> {
  /**
   * Find all entities with optional filters
   */
  findAll(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * Find entities with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
    options?: FindManyOptions<T>,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Find a single entity by ID
   */
  findById(id: string): Promise<T>;

  /**
   * Find a single entity with options
   */
  findOne(options: FindOneOptions<T>): Promise<T | null>;

  /**
   * Create a new entity
   */
  create(data: DeepPartial<T>): Promise<T>;

  /**
   * Create multiple entities
   */
  createMany(data: DeepPartial<T>[]): Promise<T[]>;

  /**
   * Update an entity by ID
   */
  update(id: string, data: DeepPartial<T>): Promise<T>;

  /**
   * Update multiple entities
   */
  updateMany(
    criteria: Partial<T>,
    data: DeepPartial<T>,
  ): Promise<{ affected: number }>;

  /**
   * Delete an entity by ID (soft delete if supported)
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple entities
   */
  deleteMany(ids: string[]): Promise<{ affected: number }>;

  /**
   * Check if entity exists
   */
  exists(criteria: Partial<T>): Promise<boolean>;

  /**
   * Count entities with optional filters
   */
  count(criteria?: Partial<T>): Promise<number>;
}

/**
 * Extended service interface for tenant-aware services
 */
export interface ITenantAwareService<T> extends IBaseService<T> {
  /**
   * Set the current tenant context
   */
  setTenantContext(tenantId: string): void;

  /**
   * Get the current tenant context
   */
  getTenantContext(): string | undefined;

  /**
   * Find all entities for the current tenant
   */
  findAllForTenant(options?: FindManyOptions<T>): Promise<T[]>;

  /**
   * Create entity for the current tenant
   */
  createForTenant(data: DeepPartial<T>): Promise<T>;
}

/**
 * Service interface for entities with workflow states
 */
export interface IWorkflowService<T> {
  /**
   * Transition entity to a new state
   */
  transitionState(id: string, newState: string): Promise<T>;

  /**
   * Get allowed transitions for current state
   */
  getAllowedTransitions(id: string): Promise<string[]>;

  /**
   * Validate state transition
   */
  canTransition(id: string, newState: string): Promise<boolean>;

  /**
   * Get entities by state
   */
  findByState(state: string): Promise<T[]>;
}

/**
 * Service interface for entities with audit trail
 */
export interface IAuditableService<T> {
  /**
   * Get entity history
   */
  getHistory(id: string): Promise<any[]>;

  /**
   * Get entity at specific point in time
   */
  getAtTimestamp(id: string, timestamp: Date): Promise<T | null>;

  /**
   * Log activity for entity
   */
  logActivity(
    entityId: string,
    action: string,
    details?: Record<string, any>,
  ): Promise<void>;
}