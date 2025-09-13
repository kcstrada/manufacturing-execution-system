import { Test, TestingModule } from '@nestjs/testing';
import { QualityController } from './quality.controller';
import { AuthGuard, ResourceGuard } from 'nest-keycloak-connect';
import { mockKeycloakProviders } from '../../../test/mocks/keycloak.mock';
import {
  QualityService,
  QualityMetrics,
  InspectionSummary,
  ControlChartData,
} from './quality.service';
import {
  CreateQualityMetricDto,
  CreateQualityInspectionDto,
  CreateQualityControlPlanDto,
  CreateNonConformanceReportDto,
  ReviewInspectionDto,
  CloseNonConformanceDto,
} from './dto/create-quality.dto';
import {
  UpdateQualityMetricDto,
  UpdateQualityInspectionDto,
  UpdateNonConformanceReportDto,
} from './dto/update-quality.dto';
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

describe('QualityController', () => {
  let controller: QualityController;
  let service: QualityService;

  const mockMetric: QualityMetric = {
    ...({} as unknown as QualityMetric),
    id: '1',
    metricCode: 'QM001',
    name: 'Diameter Measurement',
    type: MetricType.DIMENSION,
    unit: 'mm',
    targetValue: 10,
    minValue: 9.5,
    maxValue: 10.5,
    isCritical: true,
    isActive: true,
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
    inspectorId: 'inspector-1',
    result: InspectionResult.PASS,
    sampleSize: 10,
    defectiveQuantity: 0,
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
    version: 1,
    effectiveDate: new Date(),
    productId: 'prod-1',
    isActive: true,
    isApproved: false,
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
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    tenantId: 'tenant-1',
    version: 1,
  } as unknown as NonConformanceReport;

  const mockQualityMetrics: QualityMetrics = {
    totalInspections: 100,
    passRate: 95,
    failRate: 3,
    reworkRate: 2,
    scrapRate: 0.5,
    averageDefectsPerUnit: 0.05,
    criticalDefects: 1,
    majorDefects: 5,
    minorDefects: 10,
    firstPassYield: 95,
    overallYield: 97,
    costOfQuality: 5000,
    nonConformanceCount: 3,
    openNCRs: 3,
    averageNCRClosureTime: 5,
  };

  const mockInspectionSummary: InspectionSummary[] = [
    {
      productId: 'prod-1',
      productName: 'Product A',
      totalInspected: 50,
      totalPassed: 47,
      totalFailed: 3,
      passRate: 94,
      commonDefects: [
        {
          code: 'D001',
          description: 'Scratch',
          count: 2,
          severity: DefectSeverity.MINOR,
        },
        {
          code: 'D002',
          description: 'Dent',
          count: 1,
          severity: DefectSeverity.MAJOR,
        },
      ],
    },
  ];

  const mockControlChartData: ControlChartData = {
    metric: '1',
    data: [
      { date: new Date(), value: 10.1, ucl: 10.5, lcl: 9.5, mean: 10 },
      { date: new Date(), value: 9.9, ucl: 10.5, lcl: 9.5, mean: 10 },
    ],
    outOfControl: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualityController],
      providers: [
        {
          provide: QualityService,
          useValue: {
            createMetric: jest.fn().mockResolvedValue(mockMetric),
            findAllMetrics: jest.fn().mockResolvedValue([mockMetric]),
            findMetricById: jest.fn().mockResolvedValue(mockMetric),
            updateMetric: jest.fn().mockResolvedValue(mockMetric),
            createInspection: jest.fn().mockResolvedValue(mockInspection),
            findAllInspections: jest.fn().mockResolvedValue([mockInspection]),
            findInspectionById: jest.fn().mockResolvedValue(mockInspection),
            updateInspection: jest.fn().mockResolvedValue(mockInspection),
            reviewInspection: jest.fn().mockResolvedValue(mockInspection),
            createControlPlan: jest.fn().mockResolvedValue(mockControlPlan),
            findAllControlPlans: jest.fn().mockResolvedValue([mockControlPlan]),
            findControlPlanById: jest.fn().mockResolvedValue(mockControlPlan),
            approveControlPlan: jest.fn().mockResolvedValue(mockControlPlan),
            createNCR: jest.fn().mockResolvedValue(mockNCR),
            findAllNCRs: jest.fn().mockResolvedValue([mockNCR]),
            findNCRById: jest.fn().mockResolvedValue(mockNCR),
            updateNCR: jest.fn().mockResolvedValue(mockNCR),
            closeNCR: jest.fn().mockResolvedValue(mockNCR),
            getQualityMetrics: jest.fn().mockResolvedValue(mockQualityMetrics),
            getInspectionSummaryByProduct: jest
              .fn()
              .mockResolvedValue(mockInspectionSummary),
            getControlChartData: jest
              .fn()
              .mockResolvedValue(mockControlChartData),
            getDefectParetoAnalysis: jest.fn().mockResolvedValue([
              {
                defectCode: 'D001',
                description: 'Scratch',
                count: 25,
                percentage: 50,
              },
              {
                defectCode: 'D002',
                description: 'Dent',
                count: 15,
                percentage: 30,
              },
            ]),
            checkQualityAlerts: jest.fn().mockResolvedValue([
              {
                type: 'high_failure_rate',
                message: 'Failure rate above threshold',
                severity: 'high',
              },
            ]),
          },
        },
        ...mockKeycloakProviders,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourceGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<QualityController>(QualityController);
    service = module.get<QualityService>(QualityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Quality Metrics', () => {
    it('should create a quality metric', async () => {
      const dto: CreateQualityMetricDto = {
        metricCode: 'QM001',
        name: 'Diameter Measurement',
        type: MetricType.DIMENSION,
      };

      const result = await controller.createMetric(dto);

      expect(result).toEqual(mockMetric);
      expect(service.createMetric).toHaveBeenCalledWith(dto);
    });

    it('should get all quality metrics', async () => {
      const result = await controller.findAllMetrics(
        MetricType.DIMENSION,
        'prod-1',
        true,
        true,
      );

      expect(result).toEqual([mockMetric]);
      expect(service.findAllMetrics).toHaveBeenCalledWith({
        type: MetricType.DIMENSION,
        productId: 'prod-1',
        isCritical: true,
        isActive: true,
      });
    });

    it('should get a quality metric by ID', async () => {
      const result = await controller.findMetric('1');

      expect(result).toEqual(mockMetric);
      expect(service.findMetricById).toHaveBeenCalledWith('1');
    });

    it('should update a quality metric', async () => {
      const updateDto: UpdateQualityMetricDto = { name: 'Updated Metric' };

      const result = await controller.updateMetric('1', updateDto);

      expect(result).toEqual(mockMetric);
      expect(service.updateMetric).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('Quality Inspections', () => {
    it('should create a quality inspection', async () => {
      const dto: CreateQualityInspectionDto = {
        inspectionNumber: 'INS001',
        type: InspectionType.IN_PROCESS,
        inspectionDate: '2024-01-01',
        metricId: '1',
        inspectorId: 'inspector-1',
        result: InspectionResult.PASS,
      };

      const result = await controller.createInspection(dto);

      expect(result).toEqual(mockInspection);
      expect(service.createInspection).toHaveBeenCalledWith(dto);
    });

    it('should get all quality inspections', async () => {
      const result = await controller.findAllInspections(
        InspectionType.IN_PROCESS,
        InspectionResult.PASS,
        'prod-1',
        'wo-1',
        '2024-01-01',
        '2024-01-31',
        false,
      );

      expect(result).toEqual([mockInspection]);
      expect(service.findAllInspections).toHaveBeenCalledWith({
        type: InspectionType.IN_PROCESS,
        result: InspectionResult.PASS,
        productId: 'prod-1',
        workOrderId: 'wo-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        requiresReview: false,
      });
    });

    it('should get a quality inspection by ID', async () => {
      const result = await controller.findInspection('1');

      expect(result).toEqual(mockInspection);
      expect(service.findInspectionById).toHaveBeenCalledWith('1');
    });

    it('should update a quality inspection', async () => {
      const updateDto: UpdateQualityInspectionDto = {
        notes: 'Updated notes',
      };

      const result = await controller.updateInspection('1', updateDto);

      expect(result).toEqual(mockInspection);
      expect(service.updateInspection).toHaveBeenCalledWith('1', updateDto);
    });

    it('should review a quality inspection', async () => {
      const reviewDto: ReviewInspectionDto = {
        reviewNotes: 'Approved',
        reviewedBy: 'reviewer-1',
      };

      const result = await controller.reviewInspection('1', reviewDto);

      expect(result).toEqual(mockInspection);
      expect(service.reviewInspection).toHaveBeenCalledWith('1', reviewDto);
    });
  });

  describe('Quality Control Plans', () => {
    it('should create a control plan', async () => {
      const dto: CreateQualityControlPlanDto = {
        planCode: 'QCP001',
        name: 'Product A Control Plan',
        version: 1,
        effectiveDate: '2024-01-01',
        productId: 'prod-1',
      };

      const result = await controller.createControlPlan(dto);

      expect(result).toEqual(mockControlPlan);
      expect(service.createControlPlan).toHaveBeenCalledWith(dto);
    });

    it('should get all control plans', async () => {
      const result = await controller.findAllControlPlans('prod-1');

      expect(result).toEqual([mockControlPlan]);
      expect(service.findAllControlPlans).toHaveBeenCalledWith('prod-1');
    });

    it('should get a control plan by ID', async () => {
      const result = await controller.findControlPlan('1');

      expect(result).toEqual(mockControlPlan);
      expect(service.findControlPlanById).toHaveBeenCalledWith('1');
    });

    it('should approve a control plan', async () => {
      const result = await controller.approveControlPlan('1', 'approver-1');

      expect(result).toEqual(mockControlPlan);
      expect(service.approveControlPlan).toHaveBeenCalledWith(
        '1',
        'approver-1',
      );
    });
  });

  describe('Non-Conformance Reports', () => {
    it('should create a non-conformance report', async () => {
      const dto: CreateNonConformanceReportDto = {
        reportNumber: 'NCR001',
        reportDate: '2024-01-01',
        title: 'Dimensional Non-Conformance',
        description: 'Product dimensions out of specification',
        severity: DefectSeverity.MAJOR,
      };

      const result = await controller.createNCR(dto);

      expect(result).toEqual(mockNCR);
      expect(service.createNCR).toHaveBeenCalledWith(dto);
    });

    it('should get all non-conformance reports', async () => {
      const result = await controller.findAllNCRs(
        'open',
        DefectSeverity.MAJOR,
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual([mockNCR]);
      expect(service.findAllNCRs).toHaveBeenCalledWith({
        status: 'open',
        severity: DefectSeverity.MAJOR,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should get a non-conformance report by ID', async () => {
      const result = await controller.findNCR('1');

      expect(result).toEqual(mockNCR);
      expect(service.findNCRById).toHaveBeenCalledWith('1');
    });

    it('should update a non-conformance report', async () => {
      const updateDto: UpdateNonConformanceReportDto = {
        assignedToId: 'user-2',
      };

      const result = await controller.updateNCR('1', updateDto);

      expect(result).toEqual(mockNCR);
      expect(service.updateNCR).toHaveBeenCalledWith('1', updateDto);
    });

    it('should close a non-conformance report', async () => {
      const closeDto: CloseNonConformanceDto = {
        rootCause: 'Machine calibration issue',
        correctiveAction: 'Recalibrated machine',
        preventiveAction: 'Monthly calibration schedule',
        actualCost: 1500,
        closureNotes: 'Issue resolved',
        closedById: 'user-3',
      };

      const result = await controller.closeNCR('1', closeDto);

      expect(result).toEqual(mockNCR);
      expect(service.closeNCR).toHaveBeenCalledWith('1', closeDto);
    });
  });

  describe('Analytics and Metrics', () => {
    it('should get quality metrics', async () => {
      const result = await controller.getQualityMetrics(
        '2024-01-01',
        '2024-01-31',
        'prod-1',
      );

      expect(result).toEqual(mockQualityMetrics);
      expect(service.getQualityMetrics).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'prod-1',
      );
    });

    it('should get product inspection summary', async () => {
      const result = await controller.getProductSummary(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual(mockInspectionSummary);
      expect(service.getInspectionSummaryByProduct).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should get control chart data', async () => {
      const result = await controller.getControlChart('1', 30);

      expect(result).toEqual(mockControlChartData);
      expect(service.getControlChartData).toHaveBeenCalledWith('1', 30);
    });

    it('should get defect Pareto analysis', async () => {
      const result = await controller.getDefectPareto(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.defectCode).toBe('D001');
      expect(service.getDefectParetoAnalysis).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should get quality alerts', async () => {
      const result = await controller.getQualityAlerts();

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('high_failure_rate');
      expect(service.checkQualityAlerts).toHaveBeenCalled();
    });
  });
});