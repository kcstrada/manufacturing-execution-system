import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ForecastMethod {
  MOVING_AVERAGE = 'moving_average',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  LINEAR_REGRESSION = 'linear_regression',
}

export class ForecastDto {
  @ApiProperty({ description: 'Product IDs to forecast', type: [String] })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];

  @ApiPropertyOptional({ description: 'Warehouse code to forecast for' })
  @IsOptional()
  @IsString()
  warehouseCode?: string;

  @ApiPropertyOptional({
    description: 'Number of days to forecast ahead',
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  forecastDays?: number = 30;

  @ApiPropertyOptional({
    description: 'Number of historical days to analyze',
    default: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(730)
  historicalDays?: number = 90;

  @ApiPropertyOptional({
    enum: ForecastMethod,
    default: ForecastMethod.MOVING_AVERAGE,
  })
  @IsOptional()
  @IsEnum(ForecastMethod)
  method?: ForecastMethod = ForecastMethod.MOVING_AVERAGE;

  @ApiPropertyOptional({
    description: 'Include seasonal adjustments',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSeasonality?: boolean = false;

  @ApiPropertyOptional({
    description: 'Confidence level for predictions',
    default: 0.95,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.99)
  confidenceLevel?: number = 0.95;

  @ApiPropertyOptional({
    description: 'Lead time in days for reorder calculation',
    default: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  leadTimeDays?: number = 7;

  @ApiPropertyOptional({ description: 'Safety stock in days', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  safetyStockDays?: number = 3;
}

export class ForecastItemDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  currentStock!: number;

  @ApiProperty()
  forecastedDemand!: number;

  @ApiProperty()
  reorderPoint!: number;

  @ApiProperty()
  reorderQuantity!: number;

  @ApiProperty({ nullable: true })
  daysUntilStockout!: number | null;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  stockoutRisk!: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty()
  confidence!: number;

  @ApiProperty({ type: [String] })
  recommendations!: string[];
}

export class ForecastResultDto {
  @ApiProperty()
  forecastPeriod!: {
    startDate: Date;
    endDate: Date;
    days: number;
  };

  @ApiProperty({ enum: ForecastMethod })
  method!: ForecastMethod | string;

  @ApiProperty({ type: [ForecastItemDto] })
  items!: ForecastItemDto[];

  @ApiProperty()
  summary!: {
    totalProducts: number;
    totalForecastedDemand: number;
    averageConfidence: number;
    highRiskItems: number;
    criticalItems: number;
  };

  @ApiProperty()
  generatedAt!: Date;
}

export class DemandAnalysisDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  analysisPeriod!: {
    startDate: Date;
    endDate: Date;
    days: number;
  };

  @ApiProperty({ enum: ['stable', 'trending', 'seasonal', 'erratic'] })
  pattern!: 'stable' | 'trending' | 'seasonal' | 'erratic';

  @ApiProperty()
  statistics!: {
    averageDailyDemand: number;
    standardDeviation: number;
    coefficientOfVariation: number;
    minDemand: number;
    maxDemand: number;
    totalDemand: number;
  };

  @ApiProperty()
  trend!: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    growthRate: number;
  };

  @ApiProperty()
  seasonality!: {
    detected: boolean;
    peakMonths: number[];
    peakDaysOfWeek: number[];
  };

  @ApiProperty()
  forecastAccuracy!: number;
}

export class ReorderPointDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  reorderPoint!: number;

  @ApiProperty()
  safetyStock!: number;

  @ApiProperty()
  economicOrderQuantity!: number;

  @ApiProperty()
  averageDailyDemand!: number;

  @ApiProperty()
  leadTimeDays!: number;

  @ApiProperty()
  serviceLevel!: number;

  @ApiProperty()
  calculatedAt!: Date;
}

export class StockoutPredictionDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  warehouseCode!: string;

  @ApiProperty()
  currentStock!: number;

  @ApiProperty()
  averageDailyDemand!: number;

  @ApiProperty()
  projectedDemand!: number;

  @ApiProperty({ nullable: true })
  daysUntilStockout!: number | null;

  @ApiProperty({ nullable: true })
  stockoutDate!: Date | null;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  risk!: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty()
  probability!: number;

  @ApiProperty()
  expectedReplenishment!: number;

  @ApiProperty()
  recommendedAction!: string;
}

export class CalculateReorderPointsDto {
  @ApiProperty({
    description: 'Product IDs to calculate reorder points for',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];

  @ApiPropertyOptional({ description: 'Lead time in days', default: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  leadTimeDays?: number = 7;

  @ApiPropertyOptional({
    description: 'Service level (0.9 = 90%)',
    default: 0.95,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.99)
  serviceLevel?: number = 0.95;
}

export class PredictStockoutsDto {
  @ApiPropertyOptional({ description: 'Warehouse code to analyze' })
  @IsOptional()
  @IsString()
  warehouseCode?: string;

  @ApiPropertyOptional({ description: 'Days ahead to predict', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  daysAhead?: number = 14;
}
