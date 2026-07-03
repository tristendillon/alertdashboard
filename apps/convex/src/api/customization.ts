import { DispatchTypesTable } from './schema'
import { v } from 'convex/values'
import { authedOrThrowMutation, authedOrThrowQuery } from '../lib/auth'
import { TableAggregate } from '@convex-dev/aggregate'
import { components } from './_generated/api'
import type { DataModel, Id } from './_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { partial } from 'convex-helpers/validators'
import {
  BetterPaginate,
  BetterPaginateValidator,
  BetterPaginationSortValidator,
} from '../lib/better-paginate'

export const DispatchTypesAggregate = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: 'dispatchTypes'
}>(components.aggregate, {
  namespace: () => 'dispatchTypes',
  sortKey: (doc) => doc._creationTime,
})

export const paginatedDispatchTypes = authedOrThrowQuery({
  args: {
    paginationOpts: BetterPaginateValidator,
    sort: BetterPaginationSortValidator,
  },
  handler: async (ctx, args) => {
    const result = await BetterPaginate(
      ctx,
      'dispatchTypes',
      DispatchTypesAggregate,
      args.paginationOpts,
      args.sort
    )
    return result
  },
})

export const createDispatchType = authedOrThrowMutation({
  args: {
    dispatchTypes: v.array(v.object(DispatchTypesTable.withoutSystemFields)),
  },
  handler: async (ctx, { dispatchTypes }) => {
    const createdDispatchTypes: ((typeof dispatchTypes)[number] & {
      _id: Id<'dispatchTypes'>
    })[] = []
    for (const dispatchType of dispatchTypes) {
      const created = await ctx.db.insert('dispatchTypes', dispatchType)
      createdDispatchTypes.push({
        ...dispatchType,
        _id: created,
      })
    }
    return createdDispatchTypes
  },
})

export const updateDispatchType = authedOrThrowMutation({
  args: {
    id: v.id('dispatchTypes'),
    diff: v.object(partial(DispatchTypesTable.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    return await ctx.db.patch(id, diff)
  },
})

export const deleteDispatchType = authedOrThrowMutation({
  args: {
    id: v.id('dispatchTypes'),
  },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    await DispatchTypesAggregate.delete(ctx, doc!)
    return await ctx.db.delete(id)
  },
})

export const backFillDispatchTypesAggregate = authedOrThrowMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const dispatchTypes = await ctx.db
      .query('dispatchTypes')
      .paginate(args.paginationOpts)
    for (const dispatchType of dispatchTypes.page) {
      try {
        await DispatchTypesAggregate.insert(ctx, dispatchType)
      } catch (error) {
        continue
      }
    }
    return !dispatchTypes.isDone ? dispatchTypes.continueCursor : null
  },
})
