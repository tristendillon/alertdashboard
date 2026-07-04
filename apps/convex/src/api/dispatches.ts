// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { query } from './_generated/server'
import { type DispatchWithType, DispatchesTable } from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { TransformationEngine } from '../lib/transformations'
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

function removeDispatchType(dispatch: DispatchWithType) {
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

    const dispatchesWithType: DispatchWithType[] = await Promise.all(
      paginationResult.page.map(async (dispatch) => {
        if (!dispatch.dispatchType) {
          return { ...dispatch, dispatchType: undefined, group: 'other' }
        }
        const dispatchType = await ctx.db.get(dispatch.dispatchType)
        return {
          ...dispatch,
          dispatchType: dispatchType ?? undefined,
          group: dispatchType?.group,
        }
      })
    )

    let page: DispatchWithType[] = dispatchesWithType.map((dispatch) => ({
      ...dispatch,
      icon: getAlertIconPath(dispatch.group ?? 'other'),
      group: dispatch.group,
    }))

    if (ctx.authStatus !== 'unauthorized') {
      return {
        ...paginationResult,
        page: page.map(removeDispatchType),
      }
    }

    // Use new transformation system first, fallback to legacy if no transformation rules exist
    const transformationRules = await ctx.db
      .query('transformationRules')
      .collect()

    if (transformationRules.length > 0) {
      page = await TransformationEngine.transformDispatches(page, ctx)
    }

    return {
      ...paginationResult,
      page: page.map(removeDispatchType),
    }
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
