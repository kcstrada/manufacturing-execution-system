import {
  Product,
  ProductVariant,
  ProductTemplate,
  ProductRevision,
} from '../../../entities';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductFromTemplateDto,
} from '../dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

export interface IProductService {
  // Product CRUD
  create(createProductDto: CreateProductDto): Promise<Product>;
  findAll(query: ProductQueryDto): Promise<PaginatedResultDto<Product>>;
  findOne(id: string): Promise<Product>;
  findBySku(sku: string): Promise<Product>;
  update(id: string, updateProductDto: UpdateProductDto): Promise<Product>;
  delete(id: string): Promise<void>;

  // Product Variants
  createVariant(
    productId: string,
    variantData: Partial<ProductVariant>,
  ): Promise<ProductVariant>;
  findVariants(productId: string): Promise<ProductVariant[]>;
  updateVariant(
    variantId: string,
    variantData: Partial<ProductVariant>,
  ): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;

  // Product Templates
  createFromTemplate(
    templateId: string,
    dto: CreateProductFromTemplateDto,
  ): Promise<Product>;
  findTemplates(): Promise<ProductTemplate[]>;
  createTemplate(
    templateData: Partial<ProductTemplate>,
  ): Promise<ProductTemplate>;

  // Product Revisions
  createRevision(productId: string, reason: string): Promise<ProductRevision>;
  findRevisions(productId: string): Promise<ProductRevision[]>;
  revertToRevision(productId: string, revisionId: string): Promise<Product>;

  // Manufacturing specific
  setDefaultBOM(productId: string, bomId: string): Promise<Product>;
  setDefaultRouting(productId: string, routingId: string): Promise<Product>;
  calculateCost(productId: string): Promise<number>;
  checkAvailability(productId: string, quantity: number): Promise<boolean>;

  // Bulk operations
  bulkCreate(products: CreateProductDto[]): Promise<Product[]>;
  bulkUpdate(
    updates: { id: string; data: UpdateProductDto }[],
  ): Promise<Product[]>;
  bulkDelete(ids: string[]): Promise<void>;

  // Search and filtering
  search(searchTerm: string, filters?: any): Promise<Product[]>;
  findByCategory(categoryId: string): Promise<Product[]>;
  findManufacturable(): Promise<Product[]>;
  findPurchasable(): Promise<Product[]>;

  // Validation
  validateSKU(sku: string): Promise<boolean>;
  validateBarcode(barcode: string): Promise<boolean>;
  checkDuplicates(
    product: Partial<Product>,
  ): Promise<{ isDuplicate: boolean; duplicates?: Product[] }>;
}

export interface IProductValidationService {
  validateProduct(
    product: Partial<Product>,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateManufacturingData(
    product: Product,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateCostStructure(
    product: Product,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateDimensions(
    dimensions: any,
  ): Promise<{ valid: boolean; errors?: string[] }>;
  validateSpecifications(
    specifications: any,
  ): Promise<{ valid: boolean; errors?: string[] }>;
}

export interface IProductCostService {
  calculateMaterialCost(productId: string): Promise<number>;
  calculateLaborCost(productId: string): Promise<number>;
  calculateOverheadCost(productId: string): Promise<number>;
  calculateTotalCost(productId: string): Promise<number>;
  updateCosts(productId: string): Promise<void>;
  getCostBreakdown(productId: string): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    profitMargin?: number;
  }>;
}
