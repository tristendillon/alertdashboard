import { DispatchTypesTable, DispatchTypesValidator } from './schema'
import { v } from 'convex/values'
import { authedOrThrowMutation, queryWithAuthStatus } from '../lib/auth'
import type { Doc, Id } from './_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { partial } from 'convex-helpers/validators'
import { omit } from 'convex-helpers'
import { emptyPage } from '../lib/pagination'

// Derived text backing the search_text index, so one search matches both
// code and name.
const dispatchTypeSearchText = (t: { code: string; name?: string }) =>
  `${t.code} ${t.name ?? ''}`.trim()

export const listDispatchTypes = queryWithAuthStatus({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    group: v.optional(DispatchTypesValidator.fields.group),
  },
  handler: async (ctx, { paginationOpts, search, group }) => {
    if (ctx.authStatus === 'unauthorized') {
      return emptyPage<Doc<'dispatchTypes'>>()
    }
    const term = search?.trim()
    if (term) {
      return await ctx.db
        .query('dispatchTypes')
        .withSearchIndex('search_text', (q) =>
          group ? q.search('search', term).eq('group', group) : q.search('search', term)
        )
        .paginate(paginationOpts)
    }
    if (group) {
      return await ctx.db
        .query('dispatchTypes')
        .withIndex('by_group', (q) => q.eq('group', group))
        .paginate(paginationOpts)
    }
    return await ctx.db
      .query('dispatchTypes')
      .withIndex('by_code')
      .paginate(paginationOpts)
  },
})

export const createDispatchType = authedOrThrowMutation({
  args: omit(DispatchTypesTable.withoutSystemFields, ['search']),
  handler: async (ctx, args) => {
    return await ctx.db.insert('dispatchTypes', {
      ...args,
      search: dispatchTypeSearchText(args),
    })
  },
})

export const updateDispatchType = authedOrThrowMutation({
  args: {
    id: v.id('dispatchTypes'),
    diff: v.object(partial(omit(DispatchTypesTable.withoutSystemFields, ['search']))),
  },
  handler: async (ctx, { id, diff }) => {
    const current = await ctx.db.get(id)
    if (!current) {
      throw new Error('Dispatch type not found')
    }
    const next = { ...current, ...diff }
    return await ctx.db.patch(id, {
      ...diff,
      search: dispatchTypeSearchText(next),
    })
  },
})

export const deleteDispatchType = authedOrThrowMutation({
  args: {
    id: v.id('dispatchTypes'),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.delete(id)
  },
})

/**
 * Delete-all-then-replace import (NOT an upsert): every existing dispatch type
 * is removed and the payload becomes the complete new set, atomically.
 *
 * Transformation rules that reference dispatch types by id are re-linked by
 * code so they keep matching after the swap; codes missing from the import are
 * dropped from the rules and reported in the return value.
 *
 * Old dispatches keep dangling dispatchType ids — readers already tolerate
 * that (they fall back to group 'other'). The firstdue-listener caches
 * dispatch-type ids in memory: after running this in production, restart the
 * listener or trigger a full sync.
 */
export const importDispatchTypes = authedOrThrowMutation({
  args: {
    dispatchTypes: v.array(
      v.object(omit(DispatchTypesTable.withoutSystemFields, ['search']))
    ),
  },
  handler: async (ctx, { dispatchTypes }) => {
    if (dispatchTypes.length === 0) {
      throw new Error('Import must contain at least one dispatch type')
    }
    if (dispatchTypes.length > 2000) {
      throw new Error('Import too large; max 2000 dispatch types')
    }
    // The listener resolves unknown incoming types to the default type.
    if (!dispatchTypes.some((t) => t.default)) {
      throw new Error('Import must mark at least one dispatch type as default')
    }
    const codes = dispatchTypes.map((t) => t.code.toLowerCase())
    if (new Set(codes).size !== codes.length) {
      throw new Error('Import contains duplicate codes')
    }

    const oldTypes = await ctx.db.query('dispatchTypes').collect()
    const oldIdToCode = new Map(
      oldTypes.map((t) => [t._id, t.code.toLowerCase()])
    )

    // Snapshot each rule's referenced codes before the swap.
    const rules = await ctx.db.query('transformationRules').collect()
    const ruleCodes = rules.map((rule) => ({
      rule,
      codes: rule.dispatchTypes
        .map((id) => oldIdToCode.get(id))
        .filter((code): code is string => code !== undefined),
    }))

    for (const t of oldTypes) {
      await ctx.db.delete(t._id)
    }
    const codeToNewId = new Map<string, Id<'dispatchTypes'>>()
    for (const t of dispatchTypes) {
      const id = await ctx.db.insert('dispatchTypes', {
        ...t,
        search: dispatchTypeSearchText(t),
      })
      codeToNewId.set(t.code.toLowerCase(), id)
    }

    const droppedByRule: Record<string, string[]> = {}
    for (const { rule, codes: referencedCodes } of ruleCodes) {
      const newIds = referencedCodes
        .map((code) => codeToNewId.get(code))
        .filter((id): id is Id<'dispatchTypes'> => id !== undefined)
      const dropped = referencedCodes.filter((code) => !codeToNewId.has(code))
      if (dropped.length > 0) {
        droppedByRule[rule.name] = dropped
      }
      await ctx.db.patch(rule._id, { dispatchTypes: newIds })
    }

    return {
      deleted: oldTypes.length,
      created: dispatchTypes.length,
      droppedByRule,
    }
  },
})

// One-time backfill of the derived search field for docs created before the
// search_text index existed. Run post-deploy, looping until it returns null:
//   npx convex run customization:backfillDispatchTypeSearch '{"cursor": null}'
export const backfillDispatchTypeSearch = authedOrThrowMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { cursor }) => {
    const batch = await ctx.db
      .query('dispatchTypes')
      .paginate({ numItems: 100, cursor })
    for (const t of batch.page) {
      await ctx.db.patch(t._id, { search: dispatchTypeSearchText(t) })
    }
    return batch.isDone ? null : batch.continueCursor
  },
})
