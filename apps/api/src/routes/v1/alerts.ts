import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { asc, desc, count, eq } from 'drizzle-orm/sql'
import {
  PaginationQuerySchema,
  InsertAlertSchema,
  UpdateAlertSchema,
  SelectAlertSchema,
  createPaginatedResponseSchema,
} from '@alertdashboard/schemas'
import { db, alerts as alertsTable } from '@alertdashboard/db'

const alerts = new Hono()
  .get('/', zValidator('query', PaginationQuerySchema), async (c) => {
    const { limit, page, sortOrder } = c.req.valid('query')

    // Query alerts with pagination and sorting
    // Fetch one extra to determine if there are more results
    const [items, totalItems] = await Promise.all([
      db
        .select()
        .from(alertsTable)
        .orderBy(
          sortOrder === 'asc'
            ? asc(alertsTable.createdAt)
            : desc(alertsTable.createdAt)
        )
        .limit(limit + 1)
        .offset((page - 1) * limit),
      db
        .select({ count: count() })
        .from(alertsTable)
        .then((result) => result[0]?.count ?? 0),
    ])

    const hasMore = items.length > limit
    if (hasMore) {
      items.pop()
    }

    const schema = createPaginatedResponseSchema(SelectAlertSchema)

    const response = schema.parse({
      items,
      pagination: {
        limit,
        page,
        hasNextPage: hasMore,
        totalPages: Math.ceil(totalItems / limit),
      },
    })

    return c.json(response)
  })

  .get('/:id', async (c) => {
    const id = c.req.param('id')

    const result = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.id, id))
      .limit(1)

    const alert = result[0]

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404)
    }

    return c.json({ alert })
  })

  .post('/', zValidator('json', InsertAlertSchema), async (c) => {
    const data = c.req.valid('json')

    const result = await db.insert(alertsTable).values(data).returning()

    const alert = result[0]

    return c.json({ alert }, 201)
  })

  .patch('/:id', zValidator('json', UpdateAlertSchema), async (c) => {
    const id = c.req.param('id')
    const updates = c.req.valid('json')

    // Update alert and return the updated record
    const result = await db
      .update(alertsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(alertsTable.id, id))
      .returning()

    const alert = result[0]

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404)
    }

    return c.json({ alert })
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    // Delete alert
    await db.delete(alertsTable).where(eq(alertsTable.id, id))

    return c.json({ success: true, message: 'Alert deleted' })
  })

export default alerts
