import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { alerts } from '@alertdashboard/schemas'
import { Resource } from 'sst'

const client = postgres({
  host: Resource.Postgres.host,
  port: Resource.Postgres.port,
  database: Resource.Postgres.database,
  username: Resource.Postgres.username,
  password: Resource.Postgres.password,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})
/**
 * Drizzle ORM instance
 * Use this for all database operations
 */
export const db = drizzle(client, {
  schema: { alerts },
})

/**
 * Export the schema for direct access
 */
export { alerts }
