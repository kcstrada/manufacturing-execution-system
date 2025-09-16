import { Injectable, Scope, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { KeycloakAdminService } from '../auth/keycloak-admin.service';

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
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    // @ts-ignore - configService might be used in future tenant switching logic
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => KeycloakAdminService))
    private readonly keycloakAdminService: KeycloakAdminService,
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
  async findOneEntity<T = any>(entityClass: any, options?: any): Promise<T | null> {
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
  async getTenantStats(tenantId?: string): Promise<any> {
    const id = tenantId || this.tenantId;

    // Get actual counts from database
    const userCount = await this.entityManager
      .createQueryBuilder('User', 'u')
      .where('u.tenantId = :tenantId', { tenantId: id })
      .getCount();

    const orderCount = await this.entityManager
      .createQueryBuilder('CustomerOrder', 'o')
      .where('o.tenantId = :tenantId', { tenantId: id })
      .getCount();

    return {
      tenantId: id,
      userCount,
      orderCount,
      taskCount: 0, // Add actual query
      storageUsed: 0, // Calculate from files/attachments
      lastActivity: new Date(),
    };
  }

  /**
   * Get all tenants with real user counts from Keycloak
   */
  async findAll(): Promise<Tenant[]> {
    const tenants = await this.tenantRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    // Update each tenant with real user count from Keycloak
    for (const tenant of tenants) {
      try {
        const userCount = await this.keycloakAdminService.getUserCountByTenant(tenant.id);
        tenant.userCount = userCount;
      } catch (error) {
        console.error(`Failed to get user count for tenant ${tenant.id}:`, error);
        // Keep the existing userCount from database if Keycloak query fails
      }
    }

    return tenants;
  }

  /**
   * Get tenant by ID
   */
  async findTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  /**
   * Create new tenant
   */
  async create(createTenantDto: any): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      userCount: 0,
      orderCount: 0,
      storageUsed: 0,
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    // TypeORM save() can return array or single entity, we know it's single here
    return Array.isArray(savedTenant) ? savedTenant[0]! : savedTenant;
  }

  /**
   * Update tenant
   */
  async update(id: string, updateTenantDto: any): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    Object.assign(tenant, {
      ...updateTenantDto,
      updatedAt: new Date(),
    });

    const saved = await this.tenantRepository.save(tenant);
    return Array.isArray(saved) ? saved[0]! : saved;
  }

  /**
   * Delete tenant (soft delete)
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.findTenantById(id);
    tenant.isActive = false;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = 'Deleted by administrator';
    await this.tenantRepository.save(tenant);
  }

  /**
   * Activate tenant
   */
  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    tenant.isActive = true;
    tenant.suspendedAt = undefined;
    tenant.suspendedReason = undefined;
    const saved = await this.tenantRepository.save(tenant);
    return Array.isArray(saved) ? saved[0]! : saved;
  }

  /**
   * Suspend tenant
   */
  async suspend(id: string, reason: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    tenant.isActive = false;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;
    const saved = await this.tenantRepository.save(tenant);
    return Array.isArray(saved) ? saved[0]! : saved;
  }
}