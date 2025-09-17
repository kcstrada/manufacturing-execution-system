import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  EntityManager,
  ObjectLiteral,
} from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IBaseRepository,
  IPaginationOptions,
  IPaginatedResult,
} from './base.repository.interface';

export abstract class BaseRepository<T extends ObjectLiteral>
  implements IBaseRepository<T>
{
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch ${this.entityName} records: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<T | null> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as any,
      });
      return entity;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch ${this.entityName}: ${error.message}`,
      );
    }
  }

  async findOneBy(options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne(options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch ${this.entityName}: ${error.message}`,
      );
    }
  }

  async findByTenant(
    tenantId: string,
    options?: FindManyOptions<T>,
  ): Promise<T[]> {
    try {
      const queryOptions: FindManyOptions<T> = {
        ...options,
        where: {
          ...options?.where,
          tenantId,
        } as any,
      };
      return await this.repository.find(queryOptions);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch ${this.entityName} for tenant: ${error.message}`,
      );
    }
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity as any);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create ${this.entityName}: ${error.message}`,
      );
    }
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    try {
      const entity = await this.findOne(id);
      if (!entity) {
        throw new NotFoundException(
          `${this.entityName} with ID ${id} not found`,
        );
      }

      Object.assign(entity, data);
      return await this.repository.save(entity as any);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update ${this.entityName}: ${error.message}`,
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(
          `${this.entityName} with ID ${id} not found`,
        );
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete ${this.entityName}: ${error.message}`,
      );
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.softDelete(id);
      if (result.affected === 0) {
        throw new NotFoundException(
          `${this.entityName} with ID ${id} not found`,
        );
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to soft delete ${this.entityName}: ${error.message}`,
      );
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      const result = await this.repository.restore(id);
      if (result.affected === 0) {
        throw new NotFoundException(
          `${this.entityName} with ID ${id} not found`,
        );
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to restore ${this.entityName}: ${error.message}`,
      );
    }
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    try {
      return await this.repository.count(options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to count ${this.entityName} records: ${error.message}`,
      );
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id } as any,
      });
      return count > 0;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to check ${this.entityName} existence: ${error.message}`,
      );
    }
  }

  async findPaginated(
    options: IPaginationOptions,
    filter?: FindManyOptions<T>,
  ): Promise<IPaginatedResult<T>> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const skip = (page - 1) * limit;

      const queryOptions: FindManyOptions<T> = {
        ...filter,
        skip,
        take: limit,
      };

      if (sortBy) {
        queryOptions.order = { [sortBy]: sortOrder || 'ASC' } as any;
      }

      const [items, total] = await this.repository.findAndCount(queryOptions);
      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch paginated ${this.entityName}: ${error.message}`,
      );
    }
  }

  async transaction<R>(
    operation: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    return await this.repository.manager.transaction(operation);
  }
}
