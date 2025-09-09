import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

/**
 * Service for tenant-specific operations
 * Scoped per request to maintain tenant context
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private tenantId: string = 'default';
  private tenantConfig: any = {};

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    // @ts-ignore - configService might be used in future tenant switching logic
    private readonly configService: ConfigService,
  ) {}

  /**
   * Set the current tenant context
   */
  setTenant(tenantId: string, config?: any) {
    this.tenantId = tenantId;
    this.tenantConfig = config || {};
  }

  /**
   * Get the current tenant ID
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Get tenant configuration
   */
  getTenantConfig(): any {
    return this.tenantConfig;
  }

  /**
   * Create a query builder with automatic tenant filtering
   */
  createQueryBuilder(entityClass: any, alias: string) {
    const qb = this.entityManager.createQueryBuilder(entityClass, alias);
    
    // Automatically add tenant filter if entity has tenantId field
    const metadata = this.entityManager.getRepository(entityClass).metadata;
    if (metadata.columns.find(col => col.propertyName === 'tenantId')) {
      qb.andWhere(`${alias}.tenantId = :tenantId`, { tenantId: this.tenantId });
    }
    
    return qb;
  }

  /**
   * Find entities with automatic tenant filtering
   */
  async find<T = any>(entityClass: any, options?: any): Promise<T[]> {
    const repository = this.entityManager.getRepository(entityClass);
    
    // Check if entity has tenantId field
    const metadata = repository.metadata;
    const hasTenantId = metadata.columns.find(col => col.propertyName === 'tenantId');
    
    if (hasTenantId) {
      // Add tenant filter to options
      const whereClause = options?.where || {};
      return repository.find({
        ...options,
        where: {
          ...whereClause,
          tenantId: this.tenantId,
        },
      }) as Promise<T[]>;
    }
    
    // If no tenantId field, return without filtering
    return repository.find(options) as Promise<T[]>;
  }

  /**
   * Find one entity with automatic tenant filtering
   */
  async findOne<T = any>(entityClass: any, options?: any): Promise<T | null> {
    const repository = this.entityManager.getRepository(entityClass);
    
    // Check if entity has tenantId field
    const metadata = repository.metadata;
    const hasTenantId = metadata.columns.find(col => col.propertyName === 'tenantId');
    
    if (hasTenantId) {
      // Add tenant filter to options
      const whereClause = options?.where || {};
      return repository.findOne({
        ...options,
        where: {
          ...whereClause,
          tenantId: this.tenantId,
        },
      }) as Promise<T | null>;
    }
    
    // If no tenantId field, return without filtering
    return repository.findOne(options) as Promise<T | null>;
  }

  /**
   * Save entity with automatic tenant assignment
   */
  async save<T>(entityClass: any, entity: any): Promise<T> {
    const repository = this.entityManager.getRepository(entityClass);
    
    // Check if entity has tenantId field
    const metadata = repository.metadata;
    const hasTenantId = metadata.columns.find(col => col.propertyName === 'tenantId');
    
    if (hasTenantId && !entity.tenantId) {
      // Automatically set tenantId if not already set
      entity.tenantId = this.tenantId;
    }
    
    return repository.save(entity);
  }

  /**
   * Delete entities with automatic tenant filtering
   */
  async delete(entityClass: any, criteria: any) {
    const repository = this.entityManager.getRepository(entityClass);
    
    // Check if entity has tenantId field
    const metadata = repository.metadata;
    const hasTenantId = metadata.columns.find(col => col.propertyName === 'tenantId');
    
    if (hasTenantId) {
      // Add tenant filter to delete criteria
      if (typeof criteria === 'object' && !Array.isArray(criteria)) {
        return repository.delete({
          ...criteria,
          tenantId: this.tenantId,
        });
      }
    }
    
    return repository.delete(criteria);
  }

  /**
   * Get tenant-specific database schema name
   * Useful for schema-based multi-tenancy
   */
  getTenantSchema(): string {
    // In schema-based multi-tenancy, each tenant has its own schema
    if (this.tenantId === 'default') {
      return 'public';
    }
    return `tenant_${this.tenantId.replace(/-/g, '_')}`;
  }

  /**
   * Execute raw SQL with tenant context
   */
  async executeRawQuery(query: string, parameters?: any[]): Promise<any> {
    // Replace :tenantId placeholder in query
    if (query.includes(':tenantId')) {
      const index = parameters?.length || 0;
      query = query.replace(':tenantId', `$${index + 1}`);
      parameters = [...(parameters || []), this.tenantId];
    }
    
    return this.entityManager.query(query, parameters);
  }

  /**
   * Check if current user has access to a specific tenant
   */
  async hasAccessToTenant(userId: string, tenantId: string): Promise<boolean> {
    // This would typically check against a user_tenants table
    // For now, we'll implement a simple check
    
    // Admin users have access to all tenants
    if (await this.isAdminUser(userId)) {
      return true;
    }
    
    // Regular users only have access to their own tenant
    return this.tenantId === tenantId;
  }

  /**
   * Check if user is an admin
   */
  private async isAdminUser(_userId: string): Promise<boolean> {
    // This would typically check user roles
    // For now, return false
    return false;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(): Promise<any> {
    // Example statistics - would be computed from actual data
    return {
      tenantId: this.tenantId,
      userCount: 0,
      orderCount: 0,
      taskCount: 0,
      storageUsed: 0,
      lastActivity: new Date(),
    };
  }
}