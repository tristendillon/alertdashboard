import { v } from 'convex/values'
import { authedOrThrowMutation, authedOrThrowQuery } from '../lib/auth'
import { paginationOptsValidator } from 'convex/server'
import { TableAggregate } from '@convex-dev/aggregate'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import {
  BetterPaginate,
  BetterPaginateValidator,
  BetterPaginationSortValidator,
} from '../lib/better-paginate'

export const ViewTokensAggregate = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: 'viewTokens'
}>(components.aggregate, {
  namespace: () => 'viewTokens',
  sortKey: (doc) => doc._creationTime,
})

export const createViewToken = authedOrThrowMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const doc = {
      name,
      lastPing: Date.now(),
      token: crypto.randomUUID(),
    }
    const viewToken = await ctx.db.insert('viewTokens', doc)
    await ViewTokensAggregate.insert(ctx, {
      ...doc,
      _id: viewToken,
      _creationTime: Date.now(),
    })
    return viewToken
  },
})

export const deleteViewToken = authedOrThrowMutation({
  args: {
    id: v.id('viewTokens'),
  },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    await ViewTokensAggregate.delete(ctx, doc!)
    return await ctx.db.delete(id)
  },
})

export const getViewToken = authedOrThrowQuery({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const viewToken = await ctx.db
      .query('viewTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first()
    return viewToken
  },
})
export const paginatedViewTokens = authedOrThrowQuery({
  args: {
    paginationOpts: BetterPaginateValidator,
    sort: BetterPaginationSortValidator,
  },
  handler: async (ctx, args) => {
    return await BetterPaginate(
      ctx,
      'viewTokens',
      ViewTokensAggregate,
      args.paginationOpts,
      args.sort
    )
  },
})

export const backFillViewTokensAggregate = authedOrThrowMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const viewTokens = await ctx.db
      .query('viewTokens')
      .paginate(args.paginationOpts)
    for (const viewToken of viewTokens.page) {
      try {
        await ViewTokensAggregate.insert(ctx, viewToken)
      } catch {
        continue
      }
    }
    return !viewTokens.isDone ? viewTokens.continueCursor : null
  },
})
