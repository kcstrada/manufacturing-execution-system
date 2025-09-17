import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../entities/product.entity';

export class PaginationDto {
  @ApiProperty({ description: 'Total number of results' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Page size' })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ description: 'Has next page' })
  hasNextPage!: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPreviousPage!: boolean;
}

export class SearchMetadataDto {
  @ApiProperty({ description: 'Original search query' })
  query!: string;

  @ApiProperty({ description: 'Search execution time in milliseconds' })
  executionTime!: number;

  @ApiProperty({ description: 'Applied filters', type: [String] })
  appliedFilters!: string[];
}

export class CategoryFacetDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId!: string;

  @ApiProperty({ description: 'Category name' })
  categoryName!: string;

  @ApiProperty({ description: 'Product count' })
  count!: number;
}

export class TypeFacetDto {
  @ApiProperty({ description: 'Product type' })
  type!: string;

  @ApiProperty({ description: 'Product count' })
  count!: number;
}

export class PriceRangeFacetDto {
  @ApiProperty({ description: 'Minimum price' })
  min!: number;

  @ApiProperty({ description: 'Maximum price' })
  max!: number;

  @ApiProperty({ description: 'Average price' })
  avg!: number;
}

export class AvailabilityFacetDto {
  @ApiProperty({ description: 'Manufacturable products count' })
  manufacturable!: number;

  @ApiProperty({ description: 'Purchasable products count' })
  purchasable!: number;

  @ApiProperty({ description: 'Products with BOM count' })
  withBom!: number;

  @ApiProperty({ description: 'Products with routing count' })
  withRouting!: number;
}

export class SearchFacetsDto {
  @ApiProperty({ description: 'Category facets', type: [CategoryFacetDto] })
  categories!: CategoryFacetDto[];

  @ApiProperty({ description: 'Type facets', type: [TypeFacetDto] })
  types!: TypeFacetDto[];

  @ApiProperty({ description: 'Price range facet' })
  priceRange!: PriceRangeFacetDto;

  @ApiProperty({ description: 'Availability facet' })
  availability!: AvailabilityFacetDto;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Search results', type: [Product] })
  products!: Product[];

  @ApiProperty({ description: 'Pagination information' })
  pagination!: PaginationDto;

  @ApiProperty({ description: 'Search facets' })
  facets!: Partial<SearchFacetsDto>;

  @ApiProperty({ description: 'Search metadata' })
  searchMetadata!: SearchMetadataDto;
}