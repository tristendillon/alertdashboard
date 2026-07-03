import { v } from 'convex/values'
import { Hydrants } from './schema'
import { query } from './_generated/server'
import { authedOrThrowMutation, authedOrThrowQuery } from '../lib/auth'
import { geospatial } from '.'
import { paginationOptsValidator } from 'convex/server'
import type { DataModel } from './_generated/dataModel'
import { TableAggregate } from '@convex-dev/aggregate'
import { components } from './_generated/api'
import { partial } from 'convex-helpers/validators'
import {
  BetterPaginate,
  BetterPaginateValidator,
  BetterPaginationSortValidator,
} from '../lib/better-paginate'

export const HydrantsAggregate = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: 'hydrants'
}>(components.aggregate, {
  namespace: () => 'hydrants',
  sortKey: (doc) => doc._creationTime,
})

export const paginatedCreateHydrants = authedOrThrowMutation({
  args: {
    hydrants: v.array(
      v.object({
        ...Hydrants.withoutSystemFields,
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.hydrants.length > 100) {
      throw new Error('Cannot create more than 100 hydrants at once')
    }
    const existingHydrants = (
      await Promise.all(
        args.hydrants.map(async (hydrant) => {
          const existingHydrant = await ctx.db
            .query('hydrants')
            .withIndex('by_hydrantId', (q) =>
              q.eq('hydrantId', hydrant.hydrantId)
            )
            .first()
          return existingHydrant
        })
      )
    ).filter((hydrant) => hydrant !== null)
    const existingHydrantsMap = new Map(
      existingHydrants.map((hydrant) => [hydrant.hydrantId, hydrant])
    )

    const newHydrants = await Promise.all(
      args.hydrants.map(async ({ latitude, longitude, ...hydrant }) => {
        const existingHydrant = existingHydrantsMap.get(hydrant.hydrantId)
        if (existingHydrant) {
          await ctx.db.patch(existingHydrant._id, hydrant)
          await geospatial.remove(ctx, existingHydrant._id)
          await geospatial.insert(
            ctx,
            existingHydrant._id,
            { latitude, longitude },
            {}
          )
          return {
            ...hydrant,
            _id: existingHydrant._id,
          }
        } else {
          const id = await ctx.db.insert('hydrants', hydrant)
          await geospatial.insert(ctx, id, { latitude, longitude }, {})
          await HydrantsAggregate.insert(ctx, {
            ...hydrant,
            _id: id,
            _creationTime: Date.now(),
          })
          return { ...hydrant, _id: id }
        }
      })
    )
    return newHydrants
  },
})

export const deleteHydrant = authedOrThrowMutation({
  args: {
    id: v.id('hydrants'),
  },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    await HydrantsAggregate.delete(ctx, doc!)
    await geospatial.remove(ctx, id)
    return await ctx.db.delete(id)
  },
})

export const updateHydrant = authedOrThrowMutation({
  args: {
    id: v.id('hydrants'),
    diff: v.object(
      partial({
        ...Hydrants.withoutSystemFields,
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { id, diff }) => {
    const old = await geospatial.get(ctx, id)
    await geospatial.remove(ctx, id)
    if (diff.latitude && diff.longitude) {
      await geospatial.insert(
        ctx,
        id,
        { latitude: diff.latitude, longitude: diff.longitude },
        {}
      )
    }
    if (diff.latitude && !diff.longitude) {
      await geospatial.insert(
        ctx,
        id,
        {
          latitude: diff.latitude,
          longitude: old!.coordinates.longitude,
        },
        {}
      )
    }
    if (!diff.latitude && diff.longitude) {
      await geospatial.insert(
        ctx,
        id,
        { latitude: old!.coordinates.latitude, longitude: diff.longitude },
        {}
      )
    }
    return await ctx.db.patch(id, diff)
  },
})

export const paginatedHydrants = authedOrThrowQuery({
  args: {
    paginationOpts: BetterPaginateValidator,
    sort: BetterPaginationSortValidator,
  },
  handler: async (ctx, args) => {
    return await BetterPaginate(
      ctx,
      'hydrants',
      HydrantsAggregate,
      args.paginationOpts,
      args.sort
    )
  },
})

export const paginatedDeleteHydrants = authedOrThrowMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const hydrants = await ctx.db.query('hydrants').paginate({
      numItems: 100,
      cursor: args.cursor,
    })
    for (const hydrant of hydrants.page) {
      await ctx.db.delete(hydrant._id)
      await HydrantsAggregate.delete(ctx, hydrant)
      await geospatial.remove(ctx, hydrant._id)
    }
    return hydrants.continueCursor
  },
})
export const getHydrantsByBounds = query({
  args: {
    paginationOpts: paginationOptsValidator,
    topLeft: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    bottomRight: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { topLeft, bottomRight } = args

    const rectangle = {
      west: topLeft.longitude,
      south: topLeft.latitude,
      east: bottomRight.longitude,
      north: bottomRight.latitude,
    }
    const result = await geospatial.query(
      ctx,
      {
        shape: { type: 'rectangle', rectangle },
        limit: args.paginationOpts.numItems,
      },
      args.paginationOpts.cursor ?? undefined
    )
    const joinedPage = (
      await Promise.all(
        result.results.map(async (id) => {
          const hydrant = await ctx.db.get(id.key)
          if (!hydrant) {
            return null
          }
          return {
            ...hydrant,
            location: id.coordinates,
          }
        })
      )
    ).filter((hydrant) => hydrant !== null)
    return {
      page: joinedPage,
      isDone: result.nextCursor === undefined,
      continueCursor: result.nextCursor ?? '',
    }
  },
})

export const backFillHydrantsAggregate = authedOrThrowMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const hydrants = await ctx.db
      .query('hydrants')
      .paginate(args.paginationOpts)
    for (const hydrant of hydrants.page) {
      try {
        await HydrantsAggregate.insert(ctx, hydrant)
      } catch {
        continue
      }
    }
    return !hydrants.isDone ? hydrants.continueCursor : null
  },
})
