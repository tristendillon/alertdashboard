import { v } from 'convex/values'
import { FieldTransformations, TransformationRules } from './schema'
import {
  authedOrThrowMutation,
  authedOrThrowQuery,
  queryWithAuthStatus,
} from '../lib/auth'
import type { Doc, Id } from './_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { emptyPage } from '../lib/pagination'
import {
  compileSafeRegex,
  validateTransformationConfig,
} from '../lib/transform/core'

// Convex validator for the strategy enum, derived from the schema so new
// strategies can't drift out of sync with a hand-written literal union.
const strategyValidator = FieldTransformations.withoutSystemFields.strategy

// Field Transformations CRUD

export const createFieldTransformation = authedOrThrowMutation({
  args: FieldTransformations.withoutSystemFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert('fieldTransformations', args)
  },
})

export const updateFieldTransformation = authedOrThrowMutation({
  args: {
    id: v.id('fieldTransformations'),
    ...FieldTransformations.withoutSystemFields,
  },
  handler: async (ctx, { id, ...updates }) => {
    return await ctx.db.patch(id, updates)
  },
})

export const deleteFieldTransformation = authedOrThrowMutation({
  args: { id: v.id('fieldTransformations') },
  handler: async (ctx, { id }) => {
    // Check if any transformation rules are using this transformation via mapping table
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) => q.eq('transformationId', id))
      .collect()

    if (mappings.length > 0) {
      throw new Error(
        `Cannot delete transformation: used by ${mappings.length} rule(s)`
      )
    }

    return await ctx.db.delete(id)
  },
})

export const getFieldTransformations = queryWithAuthStatus({
  args: {},
  handler: async (ctx) => {
    if (ctx.authStatus === 'unauthorized') return []
    return await ctx.db.query('fieldTransformations').collect()
  },
})

export const getFieldTransformationsByStrategy = authedOrThrowQuery({
  args: {
    strategy: strategyValidator,
  },
  handler: async (ctx, { strategy }) => {
    return await ctx.db
      .query('fieldTransformations')
      .withIndex('by_strategy', (q) => q.eq('strategy', strategy))
      .collect()
  },
})

export const getFieldTransformationsByField = authedOrThrowQuery({
  args: {
    field: v.string(),
  },
  handler: async (ctx, { field }) => {
    return await ctx.db
      .query('fieldTransformations')
      .withIndex('by_field', (q) => q.eq('field', field))
      .collect()
  },
})

// Transformation Rules CRUD

export const createTransformationRule = authedOrThrowMutation({
  args: TransformationRules.withoutSystemFields,
  handler: async (ctx, args) => {
    // Validate that all referenced transformations exist
    const transformationIds = args.transformations
    const transformations = await Promise.all(
      transformationIds.map((id) => ctx.db.get(id))
    )

    const missingIds = transformationIds.filter(
      (id, index) => !transformations[index]
    )
    if (missingIds.length > 0) {
      throw new Error(
        `Referenced transformations not found: ${missingIds.join(', ')}`
      )
    }

    const ruleId = await ctx.db.insert('transformationRules', args)

    // Create mapping entries for efficient lookups
    await Promise.all(
      transformationIds.map((transformationId) =>
        ctx.db.insert('transformationRuleMappings', {
          transformationId,
          ruleId,
        })
      )
    )

    return ruleId
  },
})

export const updateTransformationRule = authedOrThrowMutation({
  args: {
    id: v.id('transformationRules'),
    ...TransformationRules.withoutSystemFields,
  },
  handler: async (ctx, { id, ...updates }) => {
    // Validate that all referenced transformations exist
    if (updates.transformations) {
      const transformationIds = updates.transformations
      const transformations = await Promise.all(
        transformationIds.map((transformationId) =>
          ctx.db.get(transformationId)
        )
      )

      const missingIds = transformationIds.filter(
        (transformationId, index) => !transformations[index]
      )
      if (missingIds.length > 0) {
        throw new Error(
          `Referenced transformations not found: ${missingIds.join(', ')}`
        )
      }

      // Update mapping table if transformations changed
      // First, remove all existing mappings for this rule
      const existingMappings = await ctx.db
        .query('transformationRuleMappings')
        .withIndex('by_rule', (q) => q.eq('ruleId', id))
        .collect()

      await Promise.all(
        existingMappings.map((mapping) => ctx.db.delete(mapping._id))
      )

      // Then create new mappings
      await Promise.all(
        transformationIds.map((transformationId) =>
          ctx.db.insert('transformationRuleMappings', {
            transformationId,
            ruleId: id,
          })
        )
      )
    }

    return await ctx.db.patch(id, updates)
  },
})

export const deleteTransformationRule = authedOrThrowMutation({
  args: { id: v.id('transformationRules') },
  handler: async (ctx, { id }) => {
    // Clean up mapping entries
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_rule', (q) => q.eq('ruleId', id))
      .collect()

    await Promise.all(mappings.map((mapping) => ctx.db.delete(mapping._id)))

    return await ctx.db.delete(id)
  },
})

export const getTransformationRules = queryWithAuthStatus({
  args: {},
  handler: async (ctx) => {
    if (ctx.authStatus === 'unauthorized') return []
    return await ctx.db.query('transformationRules').collect()
  },
})

export const getTransformationRuleByName = authedOrThrowQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('transformationRules')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first()
  },
})

export const getTransformationRuleWithTransformations = authedOrThrowQuery({
  args: {
    ruleId: v.id('transformationRules'),
  },
  handler: async (ctx, { ruleId }) => {
    const rule = await ctx.db.get(ruleId)
    if (!rule) return null

    const transformations = await Promise.all(
      rule.transformations.map((id) => ctx.db.get(id))
    )

    return {
      ...rule,
      transformationDetails: transformations.filter(Boolean),
    }
  },
})

export const getFieldTransformationUsage = authedOrThrowQuery({
  args: {
    transformationId: v.id('fieldTransformations'),
  },
  handler: async (ctx, { transformationId }) => {
    // Use the efficient mapping table lookup
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) =>
        q.eq('transformationId', transformationId)
      )
      .collect()

    const rules = await Promise.all(
      mappings.map((mapping) => ctx.db.get(mapping.ruleId))
    )

    const validRules = rules.filter(Boolean)

    return {
      transformationId,
      usedByRules: validRules.map((rule) => ({
        id: rule!._id,
        name: rule!.name,
      })),
      usageCount: validRules.length,
    }
  },
})

export const getRulesByTransformationId = authedOrThrowQuery({
  args: {
    transformationId: v.id('fieldTransformations'),
  },
  handler: async (ctx, { transformationId }) => {
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) =>
        q.eq('transformationId', transformationId)
      )
      .collect()

    const rules = await Promise.all(
      mappings.map((mapping) => ctx.db.get(mapping.ruleId))
    )

    return rules.filter(Boolean)
  },
})

export const listFieldTransformations = queryWithAuthStatus({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, search }) => {
    if (ctx.authStatus === 'unauthorized') {
      return emptyPage<Doc<'fieldTransformations'>>()
    }
    const term = search?.trim()
    if (term) {
      return await ctx.db
        .query('fieldTransformations')
        .withSearchIndex('search_name', (q) => q.search('name', term))
        .paginate(paginationOpts)
    }
    return await ctx.db
      .query('fieldTransformations')
      .order('desc')
      .paginate(paginationOpts)
  },
})

export const listTransformationRules = queryWithAuthStatus({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, search }) => {
    if (ctx.authStatus === 'unauthorized') {
      return emptyPage<Doc<'transformationRules'>>()
    }
    const term = search?.trim()
    if (term) {
      return await ctx.db
        .query('transformationRules')
        .withSearchIndex('search_name', (q) => q.search('name', term))
        .paginate(paginationOpts)
    }
    return await ctx.db
      .query('transformationRules')
      .order('desc')
      .paginate(paginationOpts)
  },
})

export const setTransformationRuleEnabled = authedOrThrowMutation({
  args: {
    id: v.id('transformationRules'),
    enabled: v.boolean(),
  },
  handler: async (ctx, { id, enabled }) => {
    return await ctx.db.patch(id, { enabled })
  },
})

// Structural deep-equality for transformation config comparison. Sufficient
// for the JSON-ish param values we store (primitives, arrays, plain objects).
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== 'object') return false

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key])
  )
}

// Save a rule together with its inline transformations in one shot. The
// transformations array order IS the application order. Handles create and
// update, resolving each inline config to a fieldTransformations id with
// copy-on-write semantics so editing one rule never mutates another rule's
// shared transformation.
export const saveRuleWithTransformations = authedOrThrowMutation({
  args: {
    ruleId: v.optional(v.id('transformationRules')),
    rule: v.object({
      name: v.string(),
      dispatchTypeRegex: v.string(),
      keywords: v.array(v.string()),
      dispatchTypes: v.array(v.id('dispatchTypes')),
      enabled: v.optional(v.boolean()),
      testDispatchIds: v.optional(v.array(v.id('dispatches'))),
    }),
    transformations: v.array(
      v.object({
        id: v.optional(v.id('fieldTransformations')),
        name: v.string(),
        field: v.string(),
        strategy: strategyValidator,
        params: v.record(v.string(), v.any()),
      })
    ),
  },
  handler: async (ctx, { ruleId, rule, transformations }) => {
    // 1. Validate every config + the rule's regex before touching the db.
    for (const config of transformations) {
      const errors = validateTransformationConfig(config)
      if (errors.length > 0) {
        throw new Error(`Invalid transformation: ${errors.join('; ')}`)
      }
    }
    const compiled = compileSafeRegex(rule.dispatchTypeRegex)
    if (compiled.error) {
      throw new Error(
        `Invalid dispatchTypeRegex "${rule.dispatchTypeRegex}": ${compiled.error}`
      )
    }

    // 2. Resolve each inline config to a fieldTransformations id.
    const resolvedIds: Id<'fieldTransformations'>[] = []
    for (const config of transformations) {
      if (!config.id) {
        // New library entry.
        const newId = await ctx.db.insert('fieldTransformations', {
          name: config.name,
          field: config.field,
          strategy: config.strategy,
          params: config.params,
        })
        resolvedIds.push(newId)
        continue
      }

      const existing = await ctx.db.get(config.id)
      if (!existing) {
        throw new Error(`Transformation not found: ${config.id}`)
      }

      const unchanged =
        existing.name === config.name &&
        existing.field === config.field &&
        existing.strategy === config.strategy &&
        deepEqual(existing.params, config.params)

      if (unchanged) {
        resolvedIds.push(config.id)
        continue
      }

      // Changed. Decide patch-in-place vs copy-on-write by how the existing
      // doc is referenced across rules.
      const mappings = await ctx.db
        .query('transformationRuleMappings')
        .withIndex('by_transformation', (q) =>
          q.eq('transformationId', config.id!)
        )
        .collect()

      const sharedWithOtherRules = mappings.some(
        (mapping) => mapping.ruleId !== ruleId
      )

      if (sharedWithOtherRules) {
        // Copy-on-write: editing this rule must not change other rules' output.
        const copyId = await ctx.db.insert('fieldTransformations', {
          name: config.name,
          field: config.field,
          strategy: config.strategy,
          params: config.params,
        })
        resolvedIds.push(copyId)
      } else {
        // Only this rule (or nothing) references it — safe to patch in place.
        await ctx.db.patch(config.id, {
          name: config.name,
          field: config.field,
          strategy: config.strategy,
          params: config.params,
        })
        resolvedIds.push(config.id)
      }
    }

    // 3. Insert or patch the rule with the resolved, ordered transformations.
    const ruleFields = {
      name: rule.name,
      dispatchTypeRegex: rule.dispatchTypeRegex,
      keywords: rule.keywords,
      dispatchTypes: rule.dispatchTypes,
      transformations: resolvedIds,
      ...(rule.enabled !== undefined ? { enabled: rule.enabled } : {}),
      ...(rule.testDispatchIds !== undefined
        ? { testDispatchIds: rule.testDispatchIds }
        : {}),
    }

    const finalRuleId = ruleId
      ? (await ctx.db.patch(ruleId, ruleFields), ruleId)
      : await ctx.db.insert('transformationRules', ruleFields)

    // 4. Resync mappings: drop existing rows for this rule, re-insert one per
    // resolved transformation id (mirrors updateTransformationRule).
    const existingMappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_rule', (q) => q.eq('ruleId', finalRuleId))
      .collect()
    await Promise.all(
      existingMappings.map((mapping) => ctx.db.delete(mapping._id))
    )
    await Promise.all(
      resolvedIds.map((transformationId) =>
        ctx.db.insert('transformationRuleMappings', {
          transformationId,
          ruleId: finalRuleId,
        })
      )
    )

    // 5. Detached library entries are left in place (no GC).
    return finalRuleId
  },
})
