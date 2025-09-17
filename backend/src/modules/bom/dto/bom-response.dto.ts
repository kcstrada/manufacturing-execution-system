import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BOMStatus } from '../../../entities/bill-of-materials.entity';

export class BOMComponentResponseDto {
  @ApiProperty({ description: 'Component ID' })
  id!: string;

  @ApiProperty({ description: 'Sequence number' })
  sequence!: number;

  @ApiProperty({ description: 'Component product' })
  component!: {
    id: string;
    sku: string;
    name: string;
    type: string;
    unitOfMeasure: string;
    cost?: number;
    leadTimeDays?: number;
  };

  @ApiProperty({ description: 'Quantity required' })
  quantity!: number;

  @ApiProperty({ description: 'Unit of measure' })
  unitOfMeasure!: {
    id: string;
    name: string;
    abbreviation: string;
  };

  @ApiPropertyOptional({ description: 'Scrap percentage' })
  scrapPercentage?: number;

  @ApiPropertyOptional({ description: 'Reference designator' })
  referenceDesignator?: string;

  @ApiProperty({ description: 'Is phantom component' })
  isPhantom!: boolean;

  @ApiProperty({ description: 'Is required' })
  isRequired!: boolean;

  @ApiPropertyOptional({ description: 'Supply type' })
  supplyType?: string;

  @ApiPropertyOptional({ description: 'Lead time days' })
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Unit cost' })
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Extended cost' })
  extendedCost?: number;

  @ApiProperty({ description: 'Is alternate allowed' })
  isAlternateAllowed!: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Available alternates' })
  alternates?: Array<{
    componentId: string;
    componentSku: string;
    componentName: string;
    preferenceOrder: number;
    conversionFactor: number;
    costDifference?: number;
  }>;
}

export class BOMResponseDto {
  @ApiProperty({ description: 'BOM ID' })
  id!: string;

  @ApiProperty({ description: 'Product' })
  product!: {
    id: string;
    sku: string;
    name: string;
    type: string;
  };

  @ApiPropertyOptional({ description: 'BOM name' })
  name?: string;

  @ApiPropertyOptional({ description: 'BOM description' })
  description?: string;

  @ApiProperty({ description: 'BOM version' })
  version!: string;

  @ApiProperty({ description: 'BOM status' })
  status!: BOMStatus;

  @ApiProperty({ description: 'Effective date' })
  effectiveDate!: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiryDate?: Date;

  @ApiProperty({ description: 'Yield quantity' })
  yieldQuantity!: number;

  @ApiProperty({ description: 'Scrap percentage' })
  scrapPercentage!: number;

  @ApiProperty({ description: 'Is default BOM' })
  isDefault!: boolean;

  @ApiProperty({ description: 'Is active' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Total cost' })
  totalCost?: number;

  @ApiProperty({ description: 'Components', type: [BOMComponentResponseDto] })
  components!: BOMComponentResponseDto[];

  @ApiPropertyOptional({ description: 'Alternate components' })
  alternateComponents?: Array<{
    primaryComponentId: string;
    alternateComponentId: string;
    alternateComponentName: string;
    alternateComponentSku: string;
    preferenceOrder: number;
    conversionFactor: number;
    notes?: string;
    conditions?: string;
    costDifference?: number;
    leadTimeDifference?: number;
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

  @ApiPropertyOptional({ description: 'Cost breakdown' })
  costBreakdown?: {
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
  };

  @ApiPropertyOptional({ description: 'Lead time analysis' })
  leadTimeAnalysis?: {
    criticalPath: string[];
    totalLeadTime: number;
    longestLeadComponent: string;
  };

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
}

export class BOMListResponseDto {
  @ApiProperty({ description: 'BOMs', type: [BOMResponseDto] })
  items!: BOMResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Page number' })
  page!: number;

  @ApiProperty({ description: 'Page size' })
  pageSize!: number;
}

export class BOMExplosionDto {
  @ApiProperty({ description: 'Level in BOM hierarchy' })
  level!: number;

  @ApiProperty({ description: 'Component' })
  component!: {
    id: string;
    sku: string;
    name: string;
    type: string;
  };

  @ApiProperty({ description: 'Quantity required' })
  quantity!: number;

  @ApiProperty({ description: 'Total quantity (multiplied through levels)' })
  totalQuantity!: number;

  @ApiProperty({ description: 'Unit of measure' })
  unitOfMeasure!: string;

  @ApiPropertyOptional({ description: 'Unit cost' })
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Extended cost' })
  extendedCost?: number;

  @ApiPropertyOptional({ description: 'Lead time days' })
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Parent component ID' })
  parentId?: string;

  @ApiProperty({ description: 'Path from root' })
  path!: string[];

  @ApiProperty({ description: 'Has children' })
  hasChildren!: boolean;

  @ApiPropertyOptional({ description: 'Children components' })
  children?: BOMExplosionDto[];
}

export class BOMCostRollupDto {
  @ApiProperty({ description: 'Product' })
  product!: {
    id: string;
    sku: string;
    name: string;
  };

  @ApiProperty({ description: 'BOM version' })
  bomVersion!: string;

  @ApiProperty({ description: 'Material costs' })
  materialCosts!: Array<{
    componentId: string;
    componentSku: string;
    componentName: string;
    quantity: number;
    unitCost: number;
    extendedCost: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Total material cost' })
  totalMaterialCost!: number;

  @ApiPropertyOptional({ description: 'Labor cost' })
  laborCost?: number;

  @ApiPropertyOptional({ description: 'Overhead cost' })
  overheadCost?: number;

  @ApiProperty({ description: 'Total cost' })
  totalCost!: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'Margin analysis' })
  marginAnalysis?: {
    sellingPrice: number;
    grossMargin: number;
    grossMarginPercentage: number;
  };
}