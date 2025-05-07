import { crud } from 'convex-helpers/server/crud'
import schema from './schema'
import { mutationWithRLS, queryWithRLS } from '../middleware/rls'
import { v } from 'convex/values'
import { doc, partial } from 'convex-helpers/validators'
import { mutationWithApiKey } from '../middleware/apiKey'
import { internal } from './_generated/api'
import { hasPermission } from '../lib/permissions'
import { omit } from 'convex-helpers'
import { type QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { queryWithAuthedUser } from '../middleware/user'

// functions that use APIKeys are not used normally with instead they are called internally via http
// Thats why the returns look the way they do
export const createAlertWithApiKey = mutationWithApiKey({
  args: {
    apiKey: v.string(),
    organization: v.id('organizations'),
    department: v.union(v.literal('ALL'), v.id('departments')),
    alert: v.object(
      omit(doc(schema, 'alerts').fields, ['_id', '_creationTime'])
    ),
  },
  handler: async (ctx, args) => {
    const { alert, apiKey, organization, department } = args
    const key = await ctx.runQuery(internal.authSchema.apiKeys.readKey, {
      key: apiKey,
      organization: organization,
      department: department,
    })
    if (!key) {
      return {
        json: {
          status: 'Error',
          message: 'Invalid API key',
        },
        status: 401,
      }
    }

    if (
      !hasPermission({
        perms: new Set(key.permissions),
        required: ['alert:insert'],
      })
    ) {
      return {
        json: {
          status: 'Error',
          message: 'Api Key is not allowed to insert alerts',
        },
        status: 403,
      }
    }

    const alertId = await ctx.db.insert('alerts', alert)
    return {
      json: {
        status: 'Created',
        alert: alertId,
      },
      status: 200,
    }
  },
})
export const updateAlertWithApiKey = mutationWithApiKey({
  args: {
    apiKey: v.string(),
    organization: v.id('organizations'),
    department: v.union(v.literal('ALL'), v.id('departments')),
    alertId: v.id('alerts'),
    alert: v.object(
      partial(omit(doc(schema, 'alerts').fields, ['_id', '_creationTime']))
    ),
  },
  handler: async (ctx, args) => {
    const { alert, apiKey, organization, department, alertId } = args
    const key = await ctx.runQuery(internal.authSchema.apiKeys.readKey, {
      key: apiKey,
      organization: organization,
      department: department,
    })
    if (!key) {
      return {
        json: {
          status: 'Error',
          message: 'Invalid API key',
        },
        status: 401,
      }
    }

    if (
      !hasPermission({
        perms: new Set(key.permissions),
        required: ['alert:modify'],
      })
    ) {
      return {
        json: {
          status: 'Error',
          message: 'Api key is not allowed to modify alerts',
        },
        status: 403,
      }
    }

    const updatedId = await ctx.db.patch(alertId, alert)
    return {
      json: {
        status: 'Updated',
        alert: updatedId,
      },
      status: 200,
    }
  },
})

const findRedactionLevel = async (
  alert: Doc<'alerts'>,
  redactionLevels: Doc<'redactionLevels'>[],
  ctx: QueryCtx
) => {
  const { mappedDescriptor, descriptor } = alert

  for (const redactionLevel of redactionLevels) {
    const { descriptors, cadDescriptorRegex, descriptorRegex, keywords } =
      redactionLevel

    const cadDescriptorPattern = cadDescriptorRegex
      ? new RegExp(cadDescriptorRegex)
      : null
    const descriptorPattern = descriptorRegex
      ? new RegExp(descriptorRegex)
      : null

    // Prioritize mapped descriptor first
    if (mappedDescriptor && descriptors.includes(mappedDescriptor)) {
      return redactionLevel
    }

    // Prioritize keywords second
    if (
      keywords.some((keyword) =>
        descriptor.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      return redactionLevel
    }

    // Prioritize mapped descriptor third
    if (mappedDescriptor) {
      const mappedDescriptorData = await ctx.db.get(mappedDescriptor)
      if (!mappedDescriptorData) continue

      const { cadDescriptor, descriptor: mappedDescriptorValue } =
        mappedDescriptorData

      if (cadDescriptorPattern && cadDescriptorPattern.test(cadDescriptor)) {
        return redactionLevel
      }

      if (
        descriptorPattern &&
        mappedDescriptorValue &&
        descriptorPattern.test(mappedDescriptorValue)
      ) {
        return redactionLevel
      }

      continue
    }
    // If all else fails, use the descriptor against the cadDescriptorRegex, if it exists
    if (
      cadDescriptorPattern &&
      descriptor &&
      cadDescriptorPattern.test(descriptor)
    ) {
      return redactionLevel
    }
    // No redaction level found
  }

  return null
}

interface RedactedAlert extends Doc<'alerts'> {
  [key: string]: string | any
}

const redactAlert = async (
  ctx: QueryCtx,
  alert: Doc<'alerts'>,
  redactionLevels: Doc<'redactionLevels'>[]
) => {
  const redactionLevel = await findRedactionLevel(alert, redactionLevels, ctx)
  if (!redactionLevel) {
    return alert
  }
  const cannotRedactFields = [
    '_id',
    '_creationTime',
    'organization',
    'department',
    'modifiedBy',
    'modifiedAt',
  ]
  const redactionFields = redactionLevel.redactionFields
  const redactedAlert: RedactedAlert = { ...alert }
  for (const field of redactionFields) {
    if (cannotRedactFields.includes(field)) {
      continue
    }
    redactedAlert[field] = '[REDACTED]'
  }
  return redactedAlert
}

export const readAlerts = queryWithAuthedUser({
  args: {
    organization: v.id('organizations'),
    department: v.union(v.literal('ALL'), v.id('departments')),
  },
  handler: async (ctx, args) => {
    const { db, authedUser } = ctx
    const { organization, department } = args
    const alerts = await db
      .query('alerts')
      .withIndex(
        `${department === 'ALL' ? 'by_organization' : 'by_department'}`,
        (q) =>
          q.eq(
            department === 'ALL' ? 'organization' : 'department',
            department === 'ALL' ? organization : department
          )
      )
      .collect()

    let returnAlerts = alerts
    if (!authedUser || authedUser.organization !== organization) {
      const redactionLevels = await db
        .query('redactionLevels')
        .withIndex(
          `${department === 'ALL' ? 'by_organization' : 'by_department'}`,
          (q) =>
            q.eq(
              department === 'ALL' ? 'organization' : 'department',
              department === 'ALL' ? organization : department
            )
        )
        .collect()

      returnAlerts = await Promise.all(
        returnAlerts.map(async (alert) => {
          const newAlert = await redactAlert(ctx, alert, redactionLevels)
          return newAlert
        })
      )
    }

    return returnAlerts
  },
})

export const {
  update: updateAlert,
  destroy: deleteAlert,
  create: createAlert,
} = crud(schema, 'alerts', queryWithRLS, mutationWithRLS)
