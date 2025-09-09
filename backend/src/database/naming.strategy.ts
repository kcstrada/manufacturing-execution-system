import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

/**
 * Custom naming strategy for TypeORM
 * Converts camelCase to snake_case for database objects
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  
  override tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
  }

  override columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join('_'));
  }

  columnNameCustomized(customName: string): string {
    return customName;
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `pk_${tableName}_${columnNames.join('_')}`;
  }

  override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `uq_${tableName}_${columnNames.join('_')}`;
  }

  override relationConstraintName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    let constraintName = `rel_${tableName}_${columnNames.join('_')}`;
    if (where) {
      constraintName += `_${where}`;
    }
    return constraintName;
  }

  override foreignKeyName(tableOrName: Table | string, columnNames: string[], _referencedTablePath?: string, _referencedColumnNames?: string[]): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const referencedTableName = _referencedTablePath?.split('.').pop();
    return `fk_${tableName}_${columnNames.join('_')}_${referencedTableName}`;
  }

  override indexName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    let indexName = `idx_${tableName}_${columnNames.join('_')}`;
    if (where) {
      indexName += `_${where}`;
    }
    return indexName;
  }

  override checkConstraintName(tableOrName: Table | string, expression: string): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const expressionSnakeCase = snakeCase(expression.replace(/[^a-zA-Z0-9]/g, '_'));
    return `chk_${tableName}_${expressionSnakeCase}`;
  }

  override exclusionConstraintName(tableOrName: Table | string, expression: string): string {
    const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const expressionSnakeCase = snakeCase(expression.replace(/[^a-zA-Z0-9]/g, '_'));
    return `excl_${tableName}_${expressionSnakeCase}`;
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  override joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string, _secondPropertyName: string): string {
    return snakeCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName);
  }

  override joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }

  classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    return alias + '__' + propertyPath.replace('.', '_');
  }
}