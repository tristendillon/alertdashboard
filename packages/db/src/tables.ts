import { Alert } from '@alertdashboard/schemas'
import { Resource } from 'sst'

/**
 * Table name constants
 * Maps logical table names to entity types
 */
export const TABLES = {
  Alerts: 'Alerts',
} as const

/**
 * Table name type
 */
export type TableName = keyof typeof TABLES

/**
 * Type mapping from table names to entity types
 * This is the magic that makes everything type-safe!
 */
export interface TableTypeMap {
  Alerts: Alert
}

/**
 * Get the entity type for a given table
 */
export type EntityType<T extends TableName> = TableTypeMap[T]

/**
 * Primary key structure for each table
 */
export interface TableKeyMap {
  Alerts: {
    id: string
  }
}

/**
 * Get the key type for a given table
 */
export type KeyType<T extends TableName> = TableKeyMap[T]

/**
 * Get the actual DynamoDB table name from SST Resource
 */
export function getTableName<T extends TableName>(table: T): string {
  // @ts-ignore - SST Resource types are generated at build time
  return Resource[table].name
}
