import { v } from 'convex/values'
import { authedOrThrowMutation, authedOrThrowQuery } from '../lib/auth'
import { paginationOptsValidator } from 'convex/server'

export const createViewToken = authedOrThrowMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    return await ctx.db.insert('viewTokens', {
      name,
      lastPing: Date.now(),
      token: crypto.randomUUID(),
    })
  },
})

export const deleteViewToken = authedOrThrowMutation({
  args: {
    id: v.id('viewTokens'),
  },
  handler: async (ctx, { id }) => {
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

export const listViewTokens = authedOrThrowQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, search }) => {
    const term = search?.trim()
    if (term) {
      return await ctx.db
        .query('viewTokens')
        .withSearchIndex('search_name', (q) => q.search('name', term))
        .paginate(paginationOpts)
    }
    return await ctx.db
      .query('viewTokens')
      .order('desc')
      .paginate(paginationOpts)
  },
})
