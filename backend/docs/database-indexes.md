# Database Performance Indexes

## Overview
This document describes the database indexing strategy implemented for the Manufacturing Execution System (MES) to optimize query performance.

## Index Categories

### 1. Composite Indexes for Frequent Query Patterns
These indexes optimize common multi-column queries:

- **Production Orders**
  - `IDX_production_orders_status_priority`: Optimizes filtering by status and sorting by priority
  - `IDX_production_orders_date_range`: Optimizes date range queries for active orders

- **Work Orders**
  - `IDX_work_orders_production_sequence`: Optimizes retrieval of work orders in sequence
  - `IDX_work_orders_assigned_status`: Optimizes worker assignment queries
  - `IDX_work_orders_completion`: Optimizes completed work order queries

- **Inventory**
  - `IDX_inventory_available_quantity`: Optimizes stock availability checks
  - `IDX_inventory_expiration`: Optimizes expiration date monitoring
  - `IDX_inventory_reorder`: Optimizes reorder point calculations

- **Tasks**
  - `IDX_tasks_worker_status`: Optimizes worker task assignment queries
  - `IDX_task_dependencies_*`: Optimizes task dependency resolution

### 2. Partial Indexes
These indexes include WHERE clauses to reduce index size and improve performance:

- `IDX_production_orders_status_priority WHERE is_active = true`
- `IDX_work_orders_assigned_status WHERE status IN ('scheduled', 'released', 'in_progress')`
- `IDX_products_low_stock WHERE is_active = true AND reorder_point IS NOT NULL`

### 3. Full-Text Search Indexes
GIN indexes for text search capabilities:

- `IDX_products_fulltext`: Enables full-text search on product names and descriptions
- `IDX_customers_fulltext`: Enables full-text search on customer names and emails

### 4. JSONB Indexes
GIN indexes for efficient JSONB column queries:

- `IDX_products_specifications`: Indexes product specification JSON data
- `IDX_quality_inspections_measurements`: Indexes quality measurement JSON data

### 5. Covering Indexes
INCLUDE clauses to avoid table lookups:

- `IDX_work_orders_covering`: Includes commonly accessed columns for work orders
- `IDX_production_orders_covering`: Includes commonly accessed columns for production orders

### 6. Foreign Key Indexes
Ensures all foreign key relationships have appropriate indexes for JOIN operations.

## Performance Optimization Strategy

1. **Multi-Tenant Optimization**: All indexes include `tenant_id` as the first column to ensure efficient tenant isolation.

2. **Query Pattern Analysis**: Indexes are designed based on common query patterns identified in repository methods.

3. **Selective Indexing**: Partial indexes reduce index size by filtering irrelevant rows.

4. **Statistics Updates**: ANALYZE commands ensure query planner has current statistics.

## Maintenance Guidelines

1. **Monitor Index Usage**: Regularly check index usage with:
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   ORDER BY idx_scan;
   ```

2. **Index Bloat**: Monitor and rebuild indexes if bloat exceeds 30%:
   ```sql
   REINDEX INDEX index_name;
   ```

3. **Update Statistics**: Run ANALYZE after bulk data operations:
   ```sql
   ANALYZE table_name;
   ```

## Migration Details

- **Migration File**: `1757470370065-AddPerformanceIndexes.ts`
- **Total Indexes Created**: 35+
- **Tables Optimized**: 15

## Performance Impact

Expected improvements:
- **Query Response Time**: 50-70% reduction for indexed queries
- **JOIN Operations**: 60-80% improvement for multi-table queries  
- **Full-Text Search**: Sub-second response for text searches
- **Report Generation**: 40-60% faster for complex reports

## Best Practices

1. Always include `tenant_id` in WHERE clauses
2. Use covering indexes for frequently accessed column combinations
3. Monitor slow query log to identify new indexing opportunities
4. Consider index maintenance during off-peak hours
5. Regularly review and remove unused indexes