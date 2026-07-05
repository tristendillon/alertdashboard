// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { query, type QueryCtx } from './_generated/server'
import {
  type DispatchWithType,
  type TransformedDispatch,
  DispatchesTable,
} from './schema'
import type { Doc } from './_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { TransformationEngine } from '../lib/transformations'
import { ruleMatchesDispatch } from '../lib/transform/core'
import {
  authedOrThrowMutation,
  authedOrThrowQuery,
  queryWithAuthStatus,
} from '../lib/auth'
import { omit } from 'convex-helpers'

export const paginatedClearDispatches = authedOrThrowMutation({
  args: {
    numItems: v.number(),
  },
  handler: async (ctx, { numItems }) => {
    const dispatches = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .take(numItems)
    for (const dispatch of dispatches) {
      await ctx.db.delete(dispatch._id)
    }
    if (dispatches.length < numItems) {
      return false
    }
    return true
  },
})

export const getDispatchTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('dispatchTypes').collect()
  },
})

export const createDispatches = authedOrThrowMutation({
  args: {
    dispatches: v.array(
      v.object(omit(DispatchesTable.withoutSystemFields, ['dispatchGroup']))
    ),
  },
  handler: async (ctx, { dispatches }) => {
    for (const dispatch of dispatches) {
      if (!dispatch.dispatchType) {
        throw new Error('Dispatch type is required')
      }
      const type = await ctx.db.get(dispatch.dispatchType)
      if (!type) {
        throw new Error('Dispatch type not found')
      }
      await ctx.db.insert('dispatches', {
        ...dispatch,
        dispatchGroup: type.group,
      })
    }
    return dispatches
  },
})

function getAlertIconPath(group: string) {
  return `/icons/incidents/${group}.png`
}

// Join a raw dispatch doc with its dispatchType doc, deriving `group` and the
// icon path. A missing/dangling dispatchType degrades gracefully to 'other'.
async function withDispatchType(
  ctx: QueryCtx,
  dispatch: Doc<'dispatches'>
): Promise<DispatchWithType> {
  const dispatchType = dispatch.dispatchType
    ? ((await ctx.db.get(dispatch.dispatchType)) ?? undefined)
    : undefined
  const group = dispatchType?.group
  return {
    ...dispatch,
    dispatchType,
    group,
    icon: getAlertIconPath(group ?? 'other'),
  }
}

function removeDispatchType(dispatch: TransformedDispatch) {
  const { dispatchType: _, ...rest } = dispatch
  return {
    ...rest,
  }
}
export const getDispatches = queryWithAuthStatus({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const paginationResult = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)

    const joined: DispatchWithType[] = await Promise.all(
      paginationResult.page.map((dispatch) => withDispatchType(ctx, dispatch))
    )

    if (ctx.authStatus !== 'unauthorized') {
      return {
        ...paginationResult,
        page: joined.map(removeDispatchType),
      }
    }

    // Read-time redaction: only unauthorized (public) callers get transformed
    // output. Skip the work entirely when no rules exist.
    const transformationRules = await ctx.db
      .query('transformationRules')
      .collect()

    const page: TransformedDispatch[] =
      transformationRules.length > 0
        ? await TransformationEngine.transformDispatches(joined, ctx)
        : joined

    return {
      ...paginationResult,
      page: page.map(removeDispatchType),
    }
  },
})
// --- Rule-editor dispatch pickers ---------------------------------------
//
// These return DispatchWithType WITH the joined dispatchType doc left in place
// (the client-side matcher needs dispatchType._id). Authed only.

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export const listDispatchesForPicker = authedOrThrowQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const paginationResult = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)

    const page: DispatchWithType[] = await Promise.all(
      paginationResult.page.map((dispatch) => withDispatchType(ctx, dispatch))
    )

    return { ...paginationResult, page }
  },
})

export const getDispatchesByIds = authedOrThrowQuery({
  args: {
    ids: v.array(v.id('dispatches')),
  },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)))
    // Dangling ids are tolerated — just drop the nulls.
    const present = docs.filter((doc): doc is Doc<'dispatches'> => doc !== null)
    return await Promise.all(
      present.map((dispatch) => withDispatchType(ctx, dispatch))
    )
  },
})

export const searchDispatchesForPicker = authedOrThrowQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchTerm, limit }) => {
    const take = clamp(limit ?? 25, 1, 50)
    const docs = await ctx.db
      .query('dispatches')
      .withSearchIndex('by_narrative', (q) => q.search('narrative', searchTerm))
      .take(take)
    return await Promise.all(
      docs.map((dispatch) => withDispatchType(ctx, dispatch))
    )
  },
})

export const getDispatchesMatchingRule = authedOrThrowQuery({
  args: {
    criteria: v.object({
      dispatchTypeRegex: v.string(),
      keywords: v.array(v.string()),
      dispatchTypes: v.array(v.id('dispatchTypes')),
    }),
    limit: v.optional(v.number()),
    scanLimit: v.optional(v.number()),
  },
  handler: async (ctx, { criteria, limit, scanLimit }) => {
    const scan = clamp(scanLimit ?? 200, 1, 500)
    const docs = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .take(scan)

    const joined = await Promise.all(
      docs.map((dispatch) => withDispatchType(ctx, dispatch))
    )

    const matched = joined.filter((dispatch) =>
      ruleMatchesDispatch(criteria, dispatch)
    )

    return matched.slice(0, clamp(limit ?? 10, 1, 25))
  },
})

export const getLastDispatchData = query({
  handler: async (ctx) => {
    const lastDispatch = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .first()
    if (!lastDispatch) {
      return null
    }
    return lastDispatch
  },
})

export const searchDispatchesByNarrative = authedOrThrowQuery({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('dispatches')
      .withSearchIndex('by_narrative', (q) => q.search('narrative', args.query))
      .collect()
  },
})

export const updateDispatch = authedOrThrowMutation({
  args: {
    id: v.id('dispatches'),
    diff: v.object(partial(DispatchesTable.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    return await ctx.db.patch(id, diff)
  },
})
