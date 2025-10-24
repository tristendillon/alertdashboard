import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  Alert,
  PaginationQuerySchema,
  InsertAlertSchema,
  UpdateAlertSchema,
} from '@alertdashboard/schemas'
import { db } from '@alertdashboard/db'
import { randomUUID } from 'crypto'

const alerts = new Hono()
  .get('/', zValidator('query', PaginationQuerySchema), async (c) => {
    const { limit, sortOrder, lastKey } = c.req.valid('query')

    // Query all alerts using timestampIndex GSI (5-10x faster than scan)
    const { items, lastEvaluatedKey } = await db.query('Alerts', {
      keyConditionExpression: '#type = :type',
      expressionAttributeNames: {
        '#type': 'type',
      },
      expressionAttributeValues: {
        ':type': 'alert',
      },
      indexName: 'timestampIndex',
      scanIndexForward: sortOrder === 'asc', // DynamoDB handles sorting
      limit,
      exclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
    })

    return c.json({
      items,
      pagination: {
        limit,
        hasMore: !!lastEvaluatedKey,
        lastKey: lastEvaluatedKey
          ? JSON.stringify(lastEvaluatedKey)
          : undefined,
      },
    })
  })

  .get('/:id', async (c) => {
    const id = c.req.param('id')

    // Get alert - automatically typed as Alert | null!
    const alert = await db.get('Alerts', { id })

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404)
    }

    return c.json({ alert })
  })

  .post('/', zValidator('json', InsertAlertSchema), async (c) => {
    const data = c.req.valid('json')

    const alert: Alert = {
      id: randomUUID(),
      timestamp: Date.now(),
      ...data,
      createdAt: Date.now(),
    }

    await db.put('Alerts', alert)

    return c.json({ alert }, 201)
  })

  .patch('/:id', zValidator('json', UpdateAlertSchema), async (c) => {
    const id = c.req.param('id')
    const updates = c.req.valid('json')

    // Fetch the existing alert
    const alert = await db.get('Alerts', { id })

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404)
    }

    const updatedAlert: Alert = {
      ...alert,
      ...updates,
      updatedAt: Date.now(),
    }

    // Type-safe put
    await db.put('Alerts', updatedAlert)

    return c.json({ alert: updatedAlert })
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    // Type-safe delete
    await db.deleteItem('Alerts', { id })

    return c.json({ success: true, message: 'Alert deleted' })
  })

export default alerts
