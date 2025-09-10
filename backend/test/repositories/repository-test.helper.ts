import { Repository } from 'typeorm';
import { ClsService } from 'nestjs-cls';

export const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
  query: jest.fn(),
});

export const mockClsService = () => ({
  get: jest.fn().mockReturnValue('test-tenant-id'),
  set: jest.fn(),
  getId: jest.fn(),
  enter: jest.fn(),
  exit: jest.fn(),
  run: jest.fn(),
  isActive: jest.fn(),
});

export const createMockQueryBuilder = () => {
  const queryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
  };
  return queryBuilder;
};

export const createTestEntity = (overrides = {}) => ({
  id: 'test-id',
  tenantId: 'test-tenant-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  version: 1,
  ...overrides,
});