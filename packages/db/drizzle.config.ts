import { defineConfig } from 'drizzle-kit'
import { Resource } from 'sst'

export default defineConfig({
  schema: '../schemas/src/entities/alert/drizzle.schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: Resource.Postgres.host,
    port: Resource.Postgres.port,
    user: Resource.Postgres.username,
    password: Resource.Postgres.password,
    database: Resource.Postgres.database,
  },
  verbose: true,
  strict: true,
})
