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
import { TableAggregate } from '@convex-dev/aggregate'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { omit } from 'convex-helpers'
import {
  BetterPaginate,
  BetterPaginateValidator,
  BetterPaginationSortValidator,
} from '../lib/better-paginate'

const DispatchAggregate = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: 'dispatches'
}>(components.aggregate, {
  namespace: () => 'dispatches',
  sortKey: (d) => d.dispatchCreatedAt,
})

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
      await DispatchAggregate.delete(ctx, dispatch)
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
      const inserted = await ctx.db.insert('dispatches', {
        ...dispatch,
        dispatchGroup: type.group,
      })
      const doc = await ctx.db.get(inserted)
      await DispatchAggregate.insert(ctx, doc!)
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
const prefixes = [
  'aircraft',
  'fire',
  'hazmat',
  'mva',
  'marine',
  'law',
  'rescue',
  'medical',
  'other',
] as const

// This is an intensive query and it should be cached for long periods of time
export const getDispatchStats = authedOrThrowQuery({
  args: {},
  handler: async (ctx) => {
    const allDispatches = await ctx.db.query('dispatches').collect()

    const counts = await Promise.all(
      prefixes.map(
        async (p) =>
          allDispatches.filter((dispatch) => dispatch.dispatchGroup === p)
            .length
      )
    )
    const countsObject = Object.fromEntries(
      prefixes.map((p, i) => [p, counts[i]])
    )
    const total = allDispatches.length

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      timeRange: `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`,
    }))
    // Get today's date in CST timezone
    const nowCST = new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    )
    nowCST.setHours(0, 0, 0, 0)

    const todaysDispatches = allDispatches.filter((dispatch) => {
      if (!dispatch.dispatchCreatedAt) return false
      const dispatchDateCST = new Date(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(dispatch.dispatchCreatedAt))
      )
      dispatchDateCST.setHours(0, 0, 0, 0)
      return dispatchDateCST.getTime() === nowCST.getTime()
    })

    // Count dispatches by hour
    allDispatches.forEach((dispatch) => {
      if (dispatch.dispatchCreatedAt) {
        const date = new Date(dispatch.dispatchCreatedAt)
        const cstHour = parseInt(
          new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            hour12: false,
            timeZone: 'America/Chicago',
          }).format(date)
        )
        hourlyData[cstHour].count += 1
      }
    })
    return {
      hours: hourlyData,
      counts: countsObject,
      todaysDispatches: todaysDispatches.length,
      total: total,
    }
  },
})

export const getRecentDispatches = authedOrThrowQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, { limit }) => {
    const dispatches = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .take(limit)
    const dispatchesWithType: DispatchWithType[] = await Promise.all(
      dispatches.map(async (dispatch) => {
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
    return dispatchesWithType
  },
})

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

export const paginatedDispatches = authedOrThrowQuery({
  args: {
    paginationOpts: BetterPaginateValidator,
    sort: BetterPaginationSortValidator,
  },
  handler: async (ctx, args) => {
    return await BetterPaginate(
      ctx,
      'dispatches',
      DispatchAggregate,
      args.paginationOpts,
      {
        index: 'by_dispatchCreatedAt',
        field: 'dispatchCreatedAt',
        order: args.sort.order,
      }
    )
  },
})

export const updateDispatch = authedOrThrowMutation({
  args: {
    id: v.id('dispatches'),
    diff: v.object(partial(DispatchesTable.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    const original = await ctx.db.get(id)
    await DispatchAggregate.delete(ctx, original!)
    await DispatchAggregate.insert(ctx, {
      ...original!,
      ...diff,
    })
    return await ctx.db.patch(id, diff)
  },
})

export const backFillDispatchAggregate = authedOrThrowMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const dispatches = await ctx.db
      .query('dispatches')
      .paginate(args.paginationOpts)
    for (const dispatch of dispatches.page) {
      try {
        await DispatchAggregate.insert(ctx, dispatch)
      } catch (error) {
        continue
      }
    }
    return !dispatches.isDone ? dispatches.continueCursor : null
  },
})

export const unfillDispatchAggregate = authedOrThrowMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const dispatches = await ctx.db
      .query('dispatches')
      .paginate(args.paginationOpts)
    for (const dispatch of dispatches.page) {
      await DispatchAggregate.delete(ctx, dispatch)
    }
    return !dispatches.isDone ? dispatches.continueCursor : null
  },
})
