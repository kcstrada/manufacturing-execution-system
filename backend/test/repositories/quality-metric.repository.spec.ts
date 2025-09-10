import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { QualityMetricRepository } from '../../src/repositories/quality-metric.repository';
import { QualityMetric, MetricType } from '../../src/entities/quality-metric.entity';
import { mockRepository, mockClsService, createTestEntity } from './repository-test.helper';

describe('QualityMetricRepository', () => {
  let repository: QualityMetricRepository;
  let typeOrmRepository: jest.Mocked<Repository<QualityMetric>>;
  let clsService: jest.Mocked<ClsService>;

  const createQualityMetric = (overrides = {}): QualityMetric => createTestEntity({
    metricCode: 'QM-001',
    name: 'Dimension Check',
    description: 'Check product dimensions',
    type: MetricType.DIMENSION,
    unit: 'mm',
    targetValue: 100,
    minValue: 98,
    maxValue: 102,
    tolerance: 2,
    isCritical: true,
    samplingFrequency: 1,
    productId: 'product-id',
    ...overrides,
  }) as QualityMetric;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityMetricRepository,
        {
          provide: getRepositoryToken(QualityMetric),
          useValue: mockRepository(),
        },
        {
          provide: ClsService,
          useValue: mockClsService(),
        },
      ],
    }).compile();

    repository = module.get<QualityMetricRepository>(QualityMetricRepository);
    typeOrmRepository = module.get(getRepositoryToken(QualityMetric));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByMetricCode', () => {
    it('should find quality metric by code', async () => {
      const metric = createQualityMetric();
      typeOrmRepository.findOne.mockResolvedValue(metric);

      const result = await repository.findByMetricCode('QM-001');

      expect(result).toEqual(metric);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { metricCode: 'QM-001', tenantId: 'test-tenant-id' },
        relations: ['product', 'inspections'],
      });
    });

    it('should return null if metric not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByMetricCode('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByProduct', () => {
    it('should find quality metrics by product', async () => {
      const metrics = [createQualityMetric()];
      typeOrmRepository.find.mockResolvedValue(metrics);

      const result = await repository.findByProduct('product-id');

      expect(result).toEqual(metrics);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-id', tenantId: 'test-tenant-id' },
        relations: ['inspections'],
      });
    });
  });

  describe('findCriticalMetrics', () => {
    it('should find critical metrics', async () => {
      const metrics = [createQualityMetric({ isCritical: true })];
      typeOrmRepository.find.mockResolvedValue(metrics);

      const result = await repository.findCriticalMetrics();

      expect(result).toEqual(metrics);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { isCritical: true, tenantId: 'test-tenant-id' },
        relations: ['product'],
      });
    });
  });

  describe('findActiveMetrics', () => {
    it('should find active metrics', async () => {
      const metrics = [createQualityMetric({ isActive: true })];
      typeOrmRepository.find.mockResolvedValue(metrics);

      const result = await repository.findActiveMetrics();

      expect(result).toEqual(metrics);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, tenantId: 'test-tenant-id' },
        relations: ['product'],
      });
    });
  });

  describe('updateTargetValues', () => {
    it('should update metric target values', async () => {
      const metric = createQualityMetric({
        targetValue: 110,
        minValue: 108,
        maxValue: 112,
        tolerance: 2,
      });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(metric);

      const result = await repository.updateTargetValues('metric-id', 110, 108, 112, 2);

      expect(result).toEqual(metric);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'metric-id', tenantId: 'test-tenant-id' },
        { targetValue: 110, minValue: 108, maxValue: 112, tolerance: 2 }
      );
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'metric-id', tenantId: 'test-tenant-id' },
      });
    });

    it('should throw error if metric not found after update', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.updateTargetValues('metric-id', 110, 108, 112, 2))
        .rejects.toThrow('QualityMetric not found');
    });
  });

  describe('getTenantId', () => {
    it('should get tenant ID from ClsService', async () => {
      const result = (repository as any).getTenantId();
      expect(result).toBe('test-tenant-id');
      expect(clsService.get).toHaveBeenCalledWith('tenantId');
    });

    it('should throw error if tenant ID not found', async () => {
      clsService.get.mockReturnValue(undefined);
      expect(() => (repository as any).getTenantId()).toThrow('Tenant context not found');
    });
  });
});