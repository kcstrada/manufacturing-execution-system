import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutingStatus } from '../../../entities/routing.entity';
import { StepType, StepStatus } from '../../../entities/production-step.entity';

export class ProductionStepResponseDto {
  @ApiProperty({ description: 'Step ID' })
  id!: string;

  @ApiProperty({ description: 'Step code' })
  stepCode!: string;

  @ApiProperty({ description: 'Step name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Step description' })
  description?: string;

  @ApiProperty({ description: 'Step type' })
  type!: StepType;

  @ApiProperty({ description: 'Step status' })
  status!: StepStatus;

  @ApiProperty({ description: 'Sequence number' })
  sequenceNumber!: number;

  @ApiPropertyOptional({ description: 'Work center' })
  workCenter?: {
    id: string;
    code: string;
    name: string;
    type: string;
    capacityPerHour: number;
  };

  @ApiPropertyOptional({ description: 'Alternate work center' })
  alternateWorkCenter?: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty({ description: 'Setup time in minutes' })
  setupTime!: number;

  @ApiProperty({ description: 'Run time per unit in minutes' })
  runTime!: number;

  @ApiPropertyOptional({ description: 'Wait time in minutes' })
  waitTime?: number;

  @ApiPropertyOptional({ description: 'Move time in minutes' })
  moveTime?: number;

  @ApiPropertyOptional({ description: 'Batch size' })
  batchSize?: number;

  @ApiPropertyOptional({ description: 'Crew size' })
  crewSize?: number;

  @ApiPropertyOptional({ description: 'Yield percentage' })
  yieldPercentage?: number;

  @ApiPropertyOptional({ description: 'Scrap percentage' })
  scrapPercentage?: number;

  @ApiPropertyOptional({ description: 'Instructions' })
  instructions?: {
    setup?: string[];
    operation?: string[];
    safety?: string[];
    quality?: string[];
  };

  @ApiPropertyOptional({ description: 'Required tools' })
  requiredTools?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;

  @ApiPropertyOptional({ description: 'Required skills' })
  requiredSkills?: Array<{
    skill: string;
    level: string;
  }>;

  @ApiPropertyOptional({ description: 'Materials' })
  materials?: Array<{
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unit: string;
  }>;

  @ApiPropertyOptional({ description: 'Quality checks' })
  qualityChecks?: Array<{
    name: string;
    description: string;
    criteria: string;
    frequency: string;
  }>;

  @ApiPropertyOptional({ description: 'Parameters' })
  parameters?: Array<{
    name: string;
    value: any;
    unit?: string;
    min?: number;
    max?: number;
  }>;

  @ApiPropertyOptional({ description: 'Validation rules' })
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;

  @ApiPropertyOptional({ description: 'Media files' })
  mediaFiles?: Array<{
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
    description?: string;
  }>;

  @ApiPropertyOptional({ description: 'Documents' })
  documents?: {
    workInstructions?: string[];
    drawings?: string[];
    videos?: string[];
    sops?: string[];
  };

  @ApiProperty({ description: 'Is critical step' })
  isCritical!: boolean;

  @ApiProperty({ description: 'Is bottleneck' })
  isBottleneck!: boolean;

  @ApiProperty({ description: 'Can be parallel' })
  canBeParallel!: boolean;

  @ApiProperty({ description: 'Requires approval' })
  requiresApproval!: boolean;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  estimatedCost?: {
    setup: number;
    run: number;
    labor: number;
    overhead: number;
    total: number;
  };

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

export class RoutingResponseDto {
  @ApiProperty({ description: 'Routing ID' })
  id!: string;

  @ApiProperty({ description: 'Product' })
  product!: {
    id: string;
    sku: string;
    name: string;
    type: string;
  };

  @ApiPropertyOptional({ description: 'Routing name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Routing description' })
  description?: string;

  @ApiProperty({ description: 'Routing version' })
  version!: string;

  @ApiProperty({ description: 'Routing status' })
  status!: RoutingStatus;

  @ApiProperty({ description: 'Effective date' })
  effectiveDate!: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiryDate?: Date;

  @ApiProperty({ description: 'Is default routing' })
  isDefault!: boolean;

  @ApiProperty({ description: 'Is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Expected yield percentage' })
  expectedYield!: number;

  @ApiProperty({ description: 'Total setup time in minutes' })
  totalSetupTimeMinutes!: number;

  @ApiProperty({ description: 'Total run time per unit in minutes' })
  totalRunTimePerUnitMinutes!: number;

  @ApiProperty({ description: 'Total cost per unit' })
  totalCostPerUnit!: number;

  @ApiProperty({ description: 'Production steps', type: [ProductionStepResponseDto] })
  steps!: ProductionStepResponseDto[];

  @ApiPropertyOptional({ description: 'Alternate routes' })
  alternateRoutes?: Array<{
    alternateRoutingId: string;
    alternateRoutingName: string;
    reason: string;
    preferenceOrder: number;
    conditions?: string;
    setupTimeMinutes: number;
    runTimePerUnitMinutes: number;
    costPerUnit: number;
    yieldPercentage: number;
    isActive: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Created by user' })
  createdBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Approved by user' })
  approvedBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Approved at' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Time analysis' })
  timeAnalysis?: {
    totalProcessTime: number;
    totalSetupTime: number;
    totalRunTime: number;
    totalWaitTime: number;
    totalMoveTime: number;
    criticalPathTime: number;
    parallelSavings: number;
  };

  @ApiPropertyOptional({ description: 'Cost analysis' })
  costAnalysis?: {
    setupCost: number;
    runCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    costPerUnit: number;
  };

  @ApiPropertyOptional({ description: 'Capacity analysis' })
  capacityAnalysis?: {
    bottleneckStep: string;
    maxCapacityPerHour: number;
    requiredCapacity: number;
    utilizationPercentage: number;
  };

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
}

export class RoutingListResponseDto {
  @ApiProperty({ description: 'Routings', type: [RoutingResponseDto] })
  items!: RoutingResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Page number' })
  page!: number;

  @ApiProperty({ description: 'Page size' })
  pageSize!: number;
}

export class RoutingTimeCalculationDto {
  @ApiProperty({ description: 'Product' })
  product!: {
    id: string;
    sku: string;
    name: string;
  };

  @ApiProperty({ description: 'Routing version' })
  routingVersion!: string;

  @ApiProperty({ description: 'Quantity' })
  quantity!: number;

  @ApiProperty({ description: 'Steps timing' })
  stepsTiming!: Array<{
    stepCode: string;
    stepName: string;
    setupTime: number;
    runTime: number;
    totalRunTime: number;
    waitTime: number;
    moveTime: number;
    totalTime: number;
    startTime?: Date;
    endTime?: Date;
  }>;

  @ApiProperty({ description: 'Total setup time' })
  totalSetupTime!: number;

  @ApiProperty({ description: 'Total run time' })
  totalRunTime!: number;

  @ApiProperty({ description: 'Total wait time' })
  totalWaitTime!: number;

  @ApiProperty({ description: 'Total move time' })
  totalMoveTime!: number;

  @ApiProperty({ description: 'Total production time' })
  totalProductionTime!: number;

  @ApiPropertyOptional({ description: 'Estimated start date' })
  estimatedStartDate?: Date;

  @ApiPropertyOptional({ description: 'Estimated completion date' })
  estimatedCompletionDate?: Date;

  @ApiPropertyOptional({ description: 'Critical path' })
  criticalPath?: string[];

  @ApiPropertyOptional({ description: 'Parallel opportunities' })
  parallelOpportunities?: Array<{
    steps: string[];
    potentialTimeSaving: number;
  }>;
}