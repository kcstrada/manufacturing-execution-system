import {
  Routing,
  ProductionStep,
  WorkInstruction,
  ProcessParameter,
} from '../../../entities';
import {
  CreateRoutingDto,
  UpdateRoutingDto,
  RoutingQueryDto,
  CreateProductionStepDto,
  UpdateProductionStepDto,
  CreateWorkInstructionDto,
  CreateProcessParameterDto,
} from '../dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

export interface IRoutingService {
  // Routing CRUD
  create(createRoutingDto: CreateRoutingDto): Promise<Routing>;
  findAll(query: RoutingQueryDto): Promise<PaginatedResultDto<Routing>>;
  findOne(id: string): Promise<Routing>;
  findByProduct(productId: string): Promise<Routing[]>;
  update(id: string, updateRoutingDto: UpdateRoutingDto): Promise<Routing>;
  delete(id: string): Promise<void>;

  // Routing Versions
  createVersion(routingId: string, versionName: string): Promise<Routing>;
  compareVersions(
    routingId1: string,
    routingId2: string,
  ): Promise<{
    added: ProductionStep[];
    removed: ProductionStep[];
    modified: ProductionStep[];
  }>;
  setAsDefault(routingId: string): Promise<Routing>;

  // Production Steps
  addStep(
    routingId: string,
    stepDto: CreateProductionStepDto,
  ): Promise<ProductionStep>;
  updateStep(
    stepId: string,
    updateDto: UpdateProductionStepDto,
  ): Promise<ProductionStep>;
  removeStep(stepId: string): Promise<void>;
  findSteps(routingId: string): Promise<ProductionStep[]>;
  reorderSteps(
    routingId: string,
    stepOrder: { id: string; sequence: number }[],
  ): Promise<void>;

  // Step Dependencies
  addStepDependency(stepId: string, dependsOnStepId: string): Promise<void>;
  removeStepDependency(stepId: string, dependsOnStepId: string): Promise<void>;
  getStepDependencies(stepId: string): Promise<ProductionStep[]>;
  validateDependencies(
    routingId: string,
  ): Promise<{ valid: boolean; cycles?: string[] }>;

  // Work Instructions
  addWorkInstruction(
    stepId: string,
    instruction: CreateWorkInstructionDto,
  ): Promise<WorkInstruction>;
  updateWorkInstruction(
    instructionId: string,
    data: Partial<WorkInstruction>,
  ): Promise<WorkInstruction>;
  removeWorkInstruction(instructionId: string): Promise<void>;
  findWorkInstructions(stepId: string): Promise<WorkInstruction[]>;

  // Process Parameters
  addParameter(
    stepId: string,
    parameter: CreateProcessParameterDto,
  ): Promise<ProcessParameter>;
  updateParameter(
    parameterId: string,
    data: Partial<ProcessParameter>,
  ): Promise<ProcessParameter>;
  removeParameter(parameterId: string): Promise<void>;
  findParameters(stepId: string): Promise<ProcessParameter[]>;

  // Alternate Routes
  addAlternateRoute(routingId: string, alternateRoute: any): Promise<void>;
  removeAlternateRoute(
    routingId: string,
    alternateRouteId: string,
  ): Promise<void>;
  findAlternateRoutes(routingId: string): Promise<any[]>;
  selectAlternateRoute(
    routingId: string,
    alternateRouteId: string,
    reason: string,
  ): Promise<void>;

  // Routing Operations
  copy(routingId: string, newProductId: string): Promise<Routing>;
  optimize(routingId: string): Promise<{
    original: Routing;
    optimized: Routing;
    improvements: string[];
  }>;
  simulate(
    routingId: string,
    quantity: number,
  ): Promise<{
    totalTime: number;
    bottlenecks: ProductionStep[];
    throughput: number;
    utilization: any[];
  }>;

  // Time and Cost Analysis
  calculateCycleTime(routingId: string): Promise<number>;
  calculateTotalTime(routingId: string, quantity: number): Promise<number>;
  calculateCost(routingId: string, quantity: number): Promise<number>;
  calculateYield(routingId: string): Promise<number>;

  // Work Center Assignment
  assignWorkCenter(stepId: string, workCenterId: string): Promise<void>;
  assignAlternateWorkCenter(
    stepId: string,
    workCenterId: string,
  ): Promise<void>;
  findAvailableWorkCenters(stepId: string): Promise<any[]>;
  balanceWorkload(routingId: string): Promise<any>;

  // Validation
  validate(
    routingId: string,
  ): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }>;
  validateCapacity(
    routingId: string,
    quantity: number,
  ): Promise<{ feasible: boolean; issues?: string[] }>;
  validateSkillRequirements(
    routingId: string,
  ): Promise<{ valid: boolean; missingSkills?: string[] }>;

  // Export/Import
  exportToJSON(routingId: string): Promise<any>;
  exportToCSV(routingId: string): Promise<string>;
  importFromJSON(productId: string, data: any): Promise<Routing>;
}

export interface IRoutingOptimizationService {
  optimizeSequence(routingId: string): Promise<ProductionStep[]>;
  balanceWorkCenters(routingId: string): Promise<any>;
  minimizeCycleTime(routingId: string): Promise<Routing>;
  maximizeThroughput(routingId: string): Promise<Routing>;
  reduceBottlenecks(routingId: string): Promise<{
    bottlenecks: ProductionStep[];
    recommendations: string[];
  }>;
  optimizeResourceUtilization(routingId: string): Promise<any>;
}

export interface IRoutingValidationService {
  validateStructure(
    routing: Routing,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateSteps(
    steps: ProductionStep[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateWorkCenters(
    steps: ProductionStep[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateParameters(
    parameters: ProcessParameter[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateMediaFiles(
    stepId: string,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateInstructions(
    instructions: WorkInstruction[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
}

export interface IProductionStepService {
  // Step Validation Rules
  addValidationRule(stepId: string, rule: any): Promise<void>;
  updateValidationRule(
    stepId: string,
    ruleId: string,
    rule: any,
  ): Promise<void>;
  removeValidationRule(stepId: string, ruleId: string): Promise<void>;
  validateParameters(
    stepId: string,
    parameters: any,
  ): Promise<{
    valid: boolean;
    failures?: any[];
  }>;

  // Media Files
  attachMediaFile(stepId: string, file: any): Promise<void>;
  removeMediaFile(stepId: string, fileId: string): Promise<void>;
  getMediaFiles(stepId: string, purpose?: string): Promise<any[]>;
  updateMediaFileAccess(stepId: string, fileId: string): Promise<void>;

  // Step Analysis
  calculateStepTime(stepId: string, quantity: number): Promise<number>;
  calculateStepCost(stepId: string, quantity: number): Promise<number>;
  analyzeBottleneck(stepId: string): Promise<{
    isBottleneck: boolean;
    utilization: number;
    recommendations?: string[];
  }>;

  // Quality Control
  defineQualityCheck(stepId: string, check: any): Promise<void>;
  getQualityChecks(stepId: string): Promise<any[]>;
  validateQualityParameters(
    stepId: string,
    measurements: any,
  ): Promise<{
    passed: boolean;
    failures?: any[];
  }>;
}
