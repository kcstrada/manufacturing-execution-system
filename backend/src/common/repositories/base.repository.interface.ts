import { FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';

export interface IBaseRepository<T> {
  findAll(options?: FindManyOptions<T>): Promise<T[]>;
  findOne(id: string): Promise<T | null>;
  findOneBy(options: FindOneOptions<T>): Promise<T | null>;
  findByTenant(tenantId: string, options?: FindManyOptions<T>): Promise<T[]>;
  create(data: DeepPartial<T>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  count(options?: FindManyOptions<T>): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ITenantAwareRepository<T> extends IBaseRepository<T> {
  findAllForTenant(
    tenantId: string,
    options?: FindManyOptions<T>,
  ): Promise<T[]>;
  findOneForTenant(tenantId: string, id: string): Promise<T | null>;
  createForTenant(tenantId: string, data: DeepPartial<T>): Promise<T>;
  updateForTenant(
    tenantId: string,
    id: string,
    data: DeepPartial<T>,
  ): Promise<T>;
  deleteForTenant(tenantId: string, id: string): Promise<boolean>;
  findPaginatedForTenant(
    tenantId: string,
    options: IPaginationOptions,
    filter?: FindManyOptions<T>,
  ): Promise<IPaginatedResult<T>>;
}
