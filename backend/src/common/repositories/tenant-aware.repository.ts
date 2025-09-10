import { Repository, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { 
  ITenantAwareRepository, 
  IPaginationOptions, 
  IPaginatedResult 
} from './base.repository.interface';
import { ClsService } from 'nestjs-cls';

export abstract class TenantAwareRepository<T extends ObjectLiteral> 
  extends BaseRepository<T> 
  implements ITenantAwareRepository<T> {
  
  constructor(
    protected override readonly repository: Repository<T>,
    protected override readonly entityName: string,
    protected readonly clsService: ClsService
  ) {
    super(repository, entityName);
  }

  protected getTenantId(): string {
    const tenantId = this.clsService.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant context not found');
    }
    return tenantId;
  }

  async findAllForTenant(
    tenantId: string, 
    options?: FindManyOptions<T>
  ): Promise<T[]> {
    const queryOptions: FindManyOptions<T> = {
      ...options,
      where: {
        ...options?.where,
        tenantId,
      } as any,
    };
    return await this.findAll(queryOptions);
  }

  async findOneForTenant(tenantId: string, id: string): Promise<T | null> {
    const entity = await this.repository.findOne({
      where: { 
        id,
        tenantId,
      } as any,
    });
    
    if (!entity) {
      return null;
    }

    return entity;
  }

  async createForTenant(
    tenantId: string, 
    data: DeepPartial<T>
  ): Promise<T> {
    const entityData = {
      ...data,
      tenantId,
    } as DeepPartial<T>;
    
    return await this.create(entityData);
  }

  async updateForTenant(
    tenantId: string, 
    id: string, 
    data: DeepPartial<T>
  ): Promise<T> {
    const entity = await this.findOneForTenant(tenantId, id);
    
    if (!entity) {
      throw new NotFoundException(
        `${this.entityName} with ID ${id} not found for tenant`
      );
    }

    // Ensure we don't accidentally change the tenant ID
    const { tenantId: _, ...updateData } = data as any;
    
    Object.assign(entity, updateData);
    return await this.repository.save(entity as any);
  }

  async deleteForTenant(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.findOneForTenant(tenantId, id);
    
    if (!entity) {
      throw new NotFoundException(
        `${this.entityName} with ID ${id} not found for tenant`
      );
    }

    const result = await this.repository.delete({
      id,
      tenantId,
    } as any);
    
    return (result.affected || 0) > 0;
  }

  async softDeleteForTenant(tenantId: string, id: string): Promise<boolean> {
    const entity = await this.findOneForTenant(tenantId, id);
    
    if (!entity) {
      throw new NotFoundException(
        `${this.entityName} with ID ${id} not found for tenant`
      );
    }

    const result = await this.repository.softDelete({
      id,
      tenantId,
    } as any);
    
    return (result.affected || 0) > 0;
  }

  async findPaginatedForTenant(
    tenantId: string,
    options: IPaginationOptions,
    filter?: FindManyOptions<T>
  ): Promise<IPaginatedResult<T>> {
    const queryOptions: FindManyOptions<T> = {
      ...filter,
      where: {
        ...filter?.where,
        tenantId,
      } as any,
    };

    return await this.findPaginated(options, queryOptions);
  }

  async countForTenant(
    tenantId: string, 
    options?: FindManyOptions<T>
  ): Promise<number> {
    const queryOptions: FindManyOptions<T> = {
      ...options,
      where: {
        ...options?.where,
        tenantId,
      } as any,
    };
    
    return await this.count(queryOptions);
  }

  async existsForTenant(tenantId: string, id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { 
        id,
        tenantId,
      } as any,
    });
    
    return count > 0;
  }

  /**
   * Validate that an entity belongs to the specified tenant
   * Throws ForbiddenException if the entity doesn't belong to the tenant
   */
  protected async validateTenantAccess(
    entity: any, 
    tenantId: string
  ): Promise<void> {
    if (entity.tenantId !== tenantId) {
      throw new ForbiddenException(
        `Access denied: ${this.entityName} does not belong to this tenant`
      );
    }
  }

  /**
   * Execute a raw query with tenant filtering
   */
  async executeQueryForTenant(
    tenantId: string,
    query: string,
    parameters: any[] = []
  ): Promise<any> {
    // Add tenant ID as the first parameter
    const params = [tenantId, ...parameters];
    
    // Ensure the query includes tenant filtering
    if (!query.toLowerCase().includes('tenant_id')) {
      throw new Error(
        'Security: Query must include tenant_id filtering'
      );
    }
    
    return await this.repository.query(query, params);
  }
}