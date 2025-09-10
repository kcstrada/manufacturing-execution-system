import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { QualityService } from './quality.service';
import {
  QualityMetric,
  QualityInspection,
  QualityControlPlan,
  NonConformanceReport,
  MetricType,
  InspectionResult,
  DefectSeverity,
  InspectionType,
} from '../../entities/quality-metric.entity';
import {
  CreateQualityMetricDto,
  CreateQualityInspectionDto,
  CreateQualityControlPlanDto,
  CreateNonConformanceReportDto,
  ReviewInspectionDto,
  CloseNonConformanceDto,
} from './dto/create-quality.dto';

describe('QualityService', () => {
  let service: QualityService;
  let metricRepository: Repository<QualityMetric>;
  let inspectionRepository: Repository<QualityInspection>;
  let planRepository: Repository<QualityControlPlan>;
  let ncrRepository: Repository<NonConformanceReport>;
  let eventEmitter: EventEmitter2;

  const mockMetric: QualityMetric = {
    id: '1',
    metricCode: 'QM001',
    name: 'Diameter Measurement',
    description: 'Measures product diameter',
    type: MetricType.DIMENSION,
    unit: 'mm',
    targetValue: 10,
    minValue: 9.5,
    maxValue: 10.5,
    tolerance: 0.5,
    isCritical: true,
    isActive: true,
    samplingFrequency: 1,
    referenceStandard: 'ISO 9001',
    inspectionMethod: {
      tools: ['Caliper'],
      procedure: ['Measure at 3 points'],
      frequency: 'Every batch',
      sampleSize: 5,
    },
    acceptanceCriteria: {
      visualDefects: ['No cracks'],
      functionalTests: ['Fits in assembly'],
      measurements: [
        {
          parameter: 'Diameter',
          min: 9.5,
          max: 10.5,
          unit: 'mm',
        },
      ],
    },
    productId: 'prod-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    tenantId: 'tenant-1',
    version: 1,
  } as unknown as QualityMetric;

  const mockInspection: QualityInspection = {
    id: '1',
    inspectionNumber: 'INS001',
    type: InspectionType.IN_PROCESS,
    inspectionDate: new Date(),
    metricId: '1',
    metric: mockMetric,
    inspectorId: 'inspector-1',
    batchNumber: 'BATCH001',
    sampleSize: 10,
    defectiveQuantity: 1,
    result: InspectionResult.PASS,
    measurements: [
      {
        metricId: '1',
        metricName: 'Diameter',
        targetValue: 10,
        actualValue: 10.1,
        unit: 'mm',
        passed: true,
      },
    ],
    defects: [],
    notes: 'Within tolerance',
    requiresReview: false,
    isReviewed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    tenantId: 'tenant-1',
    version: 1,
  } as unknown as QualityInspection;

  const mockControlPlan: QualityControlPlan = {
    id: '1',
    planCode: 'QCP001',
    name: 'Product A Control Plan',
    description: 'Quality control plan for Product A',
    version: 1,
    effectiveDate: new Date(),
    productId: 'prod-1',
    isActive: true,
    isApproved: false,
    inspectionPoints: [
      {
        stage: 'Incoming',
        description: 'Raw material inspection',
        metrics: ['QM001'],
        frequency: 'Every batch',
        responsibility: 'QC Team',
      },
    ],
    samplingPlan: [
      {
        lotSize: { min: 1, max: 100 },
        sampleSize: 5,
        acceptanceNumber: 0,
        rejectionNumber: 1,
      },
    ],
    documentation: {
      procedures: ['QP001'],
      workInstructions: ['WI001'],
      forms: ['F001'],
      standards: ['ISO 9001'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    tenantId: 'tenant-1',
  } as unknown as QualityControlPlan;

  const mockNCR: NonConformanceReport = {
    id: '1',
    reportNumber: 'NCR001',
    reportDate: new Date(),
    title: 'Dimensional Non-Conformance',
    description: 'Product dimensions out of specification',
    severity: DefectSeverity.MAJOR,
    source: 'Production',
    status: 'open',
    affectedItems: [
      {
        type: 'product',
        id: 'prod-1',
        name: 'Product A',
        quantity: 10,
        batchNumbers: ['BATCH001'],
      },
    ],
    reportedById: 'user-1',
    assignedToId: 'user-2',
    targetCloseDate: new Date(),
    immediateAction: 'Quarantine affected batch',
    estimatedCost: 1000,
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    tenantId: 'tenant-1',
    version: 1,
  } as unknown as NonConformanceReport;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityService,
        {
          provide: getRepositoryToken(QualityMetric),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(QualityInspection),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(QualityControlPlan),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(NonConformanceReport),
          useClass: Repository,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QualityService>(QualityService);
    metricRepository = module.get<Repository<QualityMetric>>(
      getRepositoryToken(QualityMetric),
    );
    inspectionRepository = module.get<Repository<QualityInspection>>(
      getRepositoryToken(QualityInspection),
    );
    planRepository = module.get<Repository<QualityControlPlan>>(
      getRepositoryToken(QualityControlPlan),
    );
    ncrRepository = module.get<Repository<NonConformanceReport>>(
      getRepositoryToken(NonConformanceReport),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Quality Metrics', () => {
    describe('createMetric', () => {
      it('should create a quality metric', async () => {
        const dto: CreateQualityMetricDto = {
          metricCode: 'QM001',
          name: 'Diameter Measurement',
          type: MetricType.DIMENSION,
          unit: 'mm',
          targetValue: 10,
          minValue: 9.5,
          maxValue: 10.5,
          isCritical: true,
        };

        jest.spyOn(metricRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(metricRepository, 'create').mockReturnValue(mockMetric);
        jest.spyOn(metricRepository, 'save').mockResolvedValue(mockMetric);

        const result = await service.createMetric(dto);

        expect(result).toEqual(mockMetric);
        expect(metricRepository.save).toHaveBeenCalledWith(mockMetric);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.metric.created',
          mockMetric,
        );
      });

      it('should throw ConflictException if metric code exists', async () => {
        const dto: CreateQualityMetricDto = {
          metricCode: 'QM001',
          name: 'Diameter Measurement',
          type: MetricType.DIMENSION,
        };

        jest.spyOn(metricRepository, 'findOne').mockResolvedValue(mockMetric);

        await expect(service.createMetric(dto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('findAllMetrics', () => {
      it('should return all metrics with filters', async () => {
        const filters = {
          type: MetricType.DIMENSION,
          productId: 'prod-1',
          isCritical: true,
          isActive: true,
        };

        jest
          .spyOn(metricRepository, 'find')
          .mockResolvedValue([mockMetric]);

        const result = await service.findAllMetrics(filters);

        expect(result).toEqual([mockMetric]);
        expect(metricRepository.find).toHaveBeenCalledWith({
          where: filters,
          relations: ['product'],
        });
      });
    });

    describe('updateMetric', () => {
      it('should update a quality metric', async () => {
        const updateDto = { name: 'Updated Metric' };
        const updatedMetric = { ...mockMetric, ...updateDto };

        jest.spyOn(metricRepository, 'findOne').mockResolvedValue(mockMetric);
        jest.spyOn(metricRepository, 'save').mockResolvedValue(updatedMetric as unknown as QualityMetric);

        const result = await service.updateMetric('1', updateDto);

        expect(result).toEqual(updatedMetric);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.metric.updated',
          updatedMetric,
        );
      });

      it('should throw NotFoundException if metric not found', async () => {
        jest.spyOn(metricRepository, 'findOne').mockResolvedValue(null);

        await expect(service.updateMetric('1', {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('Quality Inspections', () => {
    describe('createInspection', () => {
      it('should create a quality inspection', async () => {
        const dto: CreateQualityInspectionDto = {
          inspectionNumber: 'INS001',
          type: InspectionType.IN_PROCESS,
          inspectionDate: '2024-01-01',
          metricId: '1',
          inspectorId: 'inspector-1',
          result: InspectionResult.PASS,
        };

        jest.spyOn(inspectionRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(metricRepository, 'findOne').mockResolvedValue(mockMetric);
        jest
          .spyOn(inspectionRepository, 'create')
          .mockReturnValue(mockInspection);
        jest
          .spyOn(inspectionRepository, 'save')
          .mockResolvedValue(mockInspection);

        const result = await service.createInspection(dto);

        expect(result).toEqual(mockInspection);
        // No event is emitted for passing inspections
        expect(eventEmitter.emit).not.toHaveBeenCalled();
      });

      it('should throw ConflictException if inspection number exists', async () => {
        const dto: CreateQualityInspectionDto = {
          inspectionNumber: 'INS001',
          type: InspectionType.IN_PROCESS,
          inspectionDate: '2024-01-01',
          metricId: '1',
          inspectorId: 'inspector-1',
          result: InspectionResult.PASS,
        };

        jest
          .spyOn(inspectionRepository, 'findOne')
          .mockResolvedValue(mockInspection);

        await expect(service.createInspection(dto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('reviewInspection', () => {
      it('should review an inspection', async () => {
        const reviewDto: ReviewInspectionDto = {
          reviewNotes: 'Approved',
          reviewedBy: 'reviewer-1',
        };

        const reviewedInspection = {
          ...mockInspection,
          isReviewed: true,
          reviewedBy: 'reviewer-1',
          reviewedAt: new Date(),
          reviewNotes: 'Approved',
        };

        jest
          .spyOn(inspectionRepository, 'findOne')
          .mockResolvedValue(mockInspection);
        jest
          .spyOn(inspectionRepository, 'save')
          .mockResolvedValue(reviewedInspection as unknown as QualityInspection);

        const result = await service.reviewInspection('1', reviewDto);

        expect(result).toEqual(reviewedInspection);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.inspection.reviewed',
          reviewedInspection,
        );
      });
    });
  });

  describe('Quality Control Plans', () => {
    describe('createControlPlan', () => {
      it('should create a control plan', async () => {
        const dto: CreateQualityControlPlanDto = {
          planCode: 'QCP001',
          name: 'Product A Control Plan',
          version: 1,
          effectiveDate: '2024-01-01',
          productId: 'prod-1',
        };

        jest.spyOn(planRepository, 'findOne').mockResolvedValue(null);
        jest
          .spyOn(planRepository, 'create')
          .mockReturnValue(mockControlPlan);
        jest
          .spyOn(planRepository, 'save')
          .mockResolvedValue(mockControlPlan);

        const result = await service.createControlPlan(dto);

        expect(result).toEqual(mockControlPlan);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.plan.created',
          mockControlPlan,
        );
      });
    });

    describe('approveControlPlan', () => {
      it('should approve a control plan', async () => {
        const approvedPlan = {
          ...mockControlPlan,
          isApproved: true,
          approvedBy: 'approver-1',
          approvedAt: new Date(),
        };

        jest
          .spyOn(planRepository, 'findOne')
          .mockResolvedValue(mockControlPlan);
        jest.spyOn(planRepository, 'save').mockResolvedValue(approvedPlan as unknown as QualityControlPlan);

        const result = await service.approveControlPlan('1', 'approver-1');

        expect(result).toEqual(approvedPlan);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.plan.approved',
          approvedPlan,
        );
      });

      it('should throw BadRequestException if plan already approved', async () => {
        const approvedPlan = { ...mockControlPlan, isApproved: true };
        jest.spyOn(planRepository, 'findOne').mockResolvedValue(approvedPlan as unknown as QualityControlPlan);

        await expect(
          service.approveControlPlan('1', 'approver-1'),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Non-Conformance Reports', () => {
    describe('createNCR', () => {
      it('should create a non-conformance report', async () => {
        const dto: CreateNonConformanceReportDto = {
          reportNumber: 'NCR001',
          reportDate: '2024-01-01',
          title: 'Dimensional Non-Conformance',
          description: 'Product dimensions out of specification',
          severity: DefectSeverity.MAJOR,
        };

        jest.spyOn(ncrRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(ncrRepository, 'create').mockReturnValue(mockNCR);
        jest.spyOn(ncrRepository, 'save').mockResolvedValue(mockNCR);

        const result = await service.createNCR(dto);

        expect(result).toEqual(mockNCR);
        // No event is emitted for non-critical NCRs
        expect(eventEmitter.emit).not.toHaveBeenCalled();
      });
    });

    describe('closeNCR', () => {
      it('should close a non-conformance report', async () => {
        const closeDto: CloseNonConformanceDto = {
          rootCause: 'Machine calibration issue',
          correctiveAction: 'Recalibrated machine',
          preventiveAction: 'Monthly calibration schedule',
          actualCost: 1500,
          closureNotes: 'Issue resolved',
          closedById: 'user-3',
        };

        const closedNCR = {
          ...mockNCR,
          status: 'closed',
          rootCause: closeDto.rootCause,
          correctiveAction: closeDto.correctiveAction,
          preventiveAction: closeDto.preventiveAction,
          actualCost: closeDto.actualCost,
          closureNotes: closeDto.closureNotes,
          closedById: closeDto.closedById,
          closedAt: new Date(),
        };

        jest.spyOn(ncrRepository, 'findOne').mockResolvedValue(mockNCR);
        jest.spyOn(ncrRepository, 'save').mockResolvedValue(closedNCR as unknown as NonConformanceReport);

        const result = await service.closeNCR('1', closeDto);

        expect(result).toEqual(closedNCR);
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'quality.ncr.closed',
          closedNCR,
        );
      });

      it('should throw BadRequestException if NCR already closed', async () => {
        const closedNCR = { ...mockNCR, status: 'closed' };
        jest.spyOn(ncrRepository, 'findOne').mockResolvedValue(closedNCR as unknown as NonConformanceReport);

        await expect(
          service.closeNCR('1', {} as CloseNonConformanceDto),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Analytics', () => {
    describe('getQualityMetrics', () => {
      it('should calculate quality metrics', async () => {
        const inspections = [
          { ...mockInspection, result: InspectionResult.PASS },
          {
            ...mockInspection,
            id: '2',
            result: InspectionResult.FAIL,
            defectiveQuantity: 2,
          },
          { ...mockInspection, id: '3', result: InspectionResult.REWORK },
        ];

        jest
          .spyOn(inspectionRepository, 'find')
          .mockResolvedValue(inspections as QualityInspection[]);
        jest.spyOn(ncrRepository, 'find').mockResolvedValue([mockNCR]);

        const result = await service.getQualityMetrics();

        expect(result.totalInspections).toBe(3);
        expect(result.passRate).toBeCloseTo(33.33, 1);
        expect(result.failRate).toBeCloseTo(33.33, 1);
        expect(result.reworkRate).toBeCloseTo(33.33, 1);
      });
    });

    describe('getDefectParetoAnalysis', () => {
      it('should generate Pareto analysis', async () => {
        const inspections = [
          {
            ...mockInspection,
            defects: [
              {
                code: 'D001',
                description: 'Scratch',
                severity: DefectSeverity.MINOR,
                quantity: 5,
              },
              {
                code: 'D002',
                description: 'Dent',
                severity: DefectSeverity.MAJOR,
                quantity: 3,
              },
            ],
          },
          {
            ...mockInspection,
            id: '2',
            defects: [
              {
                code: 'D001',
                description: 'Scratch',
                severity: DefectSeverity.MINOR,
                quantity: 2,
              },
            ],
          },
        ];

        jest
          .spyOn(inspectionRepository, 'find')
          .mockResolvedValue(inspections as QualityInspection[]);

        const result = await service.getDefectParetoAnalysis();

        expect(result).toHaveLength(2);
        expect(result?.[0]?.defectCode).toBe('D001');
        expect(result?.[0]?.count).toBe(7);
        expect(result?.[0]?.percentage).toBeCloseTo(70, 0);
        expect(result?.[1]?.defectCode).toBe('D002');
        expect(result?.[1]?.count).toBe(3);
        expect(result?.[1]?.percentage).toBeCloseTo(30, 0);
      });
    });

    describe('checkQualityAlerts', () => {
      it('should generate quality alerts', async () => {
        const recentInspections = [
          { ...mockInspection, result: InspectionResult.FAIL },
          {
            ...mockInspection,
            id: '2',
            result: InspectionResult.FAIL,
          },
          {
            ...mockInspection,
            id: '3',
            result: InspectionResult.FAIL,
          },
        ];

        const openNCRs = [
          mockNCR,
          { ...mockNCR, id: '2', severity: DefectSeverity.CRITICAL },
        ];

        jest
          .spyOn(inspectionRepository, 'find')
          .mockResolvedValue(recentInspections as QualityInspection[]);
        jest
          .spyOn(ncrRepository, 'find')
          .mockResolvedValue(openNCRs as NonConformanceReport[]);
        jest.spyOn(ncrRepository, 'count').mockResolvedValue(5);
        jest.spyOn(metricRepository, 'count').mockResolvedValue(10);

        const result = await service.checkQualityAlerts();

        expect(result).toContainEqual(
          expect.objectContaining({
            type: 'high_failure_rate',
            severity: 'high',
          }),
        );
        expect(result).toContainEqual(
          expect.objectContaining({
            type: 'critical_ncr',
            severity: 'critical',
          }),
        );
      });
    });
  });
});