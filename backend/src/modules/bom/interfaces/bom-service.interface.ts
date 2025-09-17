import { BillOfMaterials, BOMComponent } from '../../../entities';
import {
  CreateBOMDto,
  UpdateBOMDto,
  BOMQueryDto,
  CreateBOMComponentDto,
  UpdateBOMComponentDto,
} from '../dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

export interface IBOMService {
  // BOM CRUD
  create(createBOMDto: CreateBOMDto): Promise<BillOfMaterials>;
  findAll(query: BOMQueryDto): Promise<PaginatedResultDto<BillOfMaterials>>;
  findOne(id: string): Promise<BillOfMaterials>;
  findByProduct(productId: string): Promise<BillOfMaterials[]>;
  update(id: string, updateBOMDto: UpdateBOMDto): Promise<BillOfMaterials>;
  delete(id: string): Promise<void>;

  // BOM Components
  addComponent(
    bomId: string,
    componentDto: CreateBOMComponentDto,
  ): Promise<BOMComponent>;
  updateComponent(
    componentId: string,
    updateDto: UpdateBOMComponentDto,
  ): Promise<BOMComponent>;
  removeComponent(componentId: string): Promise<void>;
  findComponents(bomId: string): Promise<BOMComponent[]>;
  reorderComponents(
    bomId: string,
    componentOrder: { id: string; sequence: number }[],
  ): Promise<void>;

  // BOM Versions
  createVersion(bomId: string, versionName: string): Promise<BillOfMaterials>;
  compareVersions(
    bomId1: string,
    bomId2: string,
  ): Promise<{
    added: BOMComponent[];
    removed: BOMComponent[];
    modified: BOMComponent[];
  }>;
  setAsDefault(bomId: string): Promise<BillOfMaterials>;

  // BOM Operations
  copy(bomId: string, newProductId: string): Promise<BillOfMaterials>;
  explode(
    bomId: string,
    quantity: number,
  ): Promise<
    {
      level: number;
      componentId: string;
      componentName: string;
      quantity: number;
      unit: string;
      cost?: number;
    }[]
  >;
  implode(componentId: string): Promise<BillOfMaterials[]>;

  // Alternate Components
  addAlternate(
    primaryComponentId: string,
    alternateComponentId: string,
    conversionFactor: number,
  ): Promise<void>;
  removeAlternate(
    primaryComponentId: string,
    alternateComponentId: string,
  ): Promise<void>;
  findAlternates(componentId: string): Promise<any[]>;
  selectAlternate(
    bomId: string,
    primaryComponentId: string,
    alternateComponentId: string,
  ): Promise<void>;

  // Validation and Analysis
  validate(
    bomId: string,
  ): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }>;
  checkCircularReference(bomId: string): Promise<boolean>;
  calculateCost(bomId: string, includeLabor?: boolean): Promise<number>;
  calculateLeadTime(bomId: string): Promise<number>;

  // Material Requirements
  getMaterialRequirements(
    bomId: string,
    quantity: number,
  ): Promise<
    {
      componentId: string;
      componentName: string;
      requiredQuantity: number;
      availableQuantity: number;
      shortage?: number;
      unit: string;
    }[]
  >;
  checkAvailability(
    bomId: string,
    quantity: number,
  ): Promise<{
    available: boolean;
    shortages?: any[];
  }>;

  // Mass update operations
  bulkUpdateComponents(
    bomId: string,
    updates: UpdateBOMComponentDto[],
  ): Promise<BOMComponent[]>;
  bulkAddComponents(
    bomId: string,
    components: CreateBOMComponentDto[],
  ): Promise<BOMComponent[]>;

  // Export/Import
  exportToJSON(bomId: string): Promise<any>;
  exportToCSV(bomId: string): Promise<string>;
  importFromJSON(productId: string, data: any): Promise<BillOfMaterials>;
  importFromCSV(productId: string, csvData: string): Promise<BillOfMaterials>;
}

export interface IBOMCostService {
  calculateMaterialCost(bomId: string): Promise<number>;
  calculateRollupCost(bomId: string): Promise<number>;
  calculateAssemblyCost(bomId: string): Promise<number>;
  updateComponentCosts(bomId: string): Promise<void>;
  getCostBreakdown(bomId: string): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    componentBreakdown: {
      componentId: string;
      componentName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      percentage: number;
    }[];
  }>;
  performCostAnalysis(bomId: string): Promise<{
    highestCostComponents: any[];
    costDrivers: any[];
    savingOpportunities: any[];
  }>;
}

export interface IBOMValidationService {
  validateStructure(
    bom: BillOfMaterials,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateComponents(
    components: BOMComponent[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateQuantities(
    components: BOMComponent[],
  ): Promise<{ valid: boolean; errors?: string[] }>;
  checkCompleteness(
    bomId: string,
  ): Promise<{ complete: boolean; missing?: string[] }>;
  checkConsistency(
    bomId: string,
  ): Promise<{ consistent: boolean; issues?: string[] }>;
}
