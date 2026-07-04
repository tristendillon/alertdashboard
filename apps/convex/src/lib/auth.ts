import { customQuery } from 'convex-helpers/server/customFunctions'
import { customMutation } from 'convex-helpers/server/customFunctions'
import { mutation, query, type QueryCtx } from '../api/_generated/server'
import { v } from 'convex/values'
import type { Id } from '../api/_generated/dataModel'

export type AuthStatus =
  | 'apiKey'
  | 'viewToken'
  | 'authenticated'
  | 'unauthorized'

const getAuthStatus = async (
  ctx: QueryCtx,
  apiKey: string | undefined,
  viewToken: Id<'viewTokens'> | undefined
): Promise<AuthStatus> => {
  const identity = await ctx.auth.getUserIdentity()
  const token = viewToken ? await ctx.db.get(viewToken) : undefined

  // API_KEY_PREVIOUS is honored during key rotation so already-deployed workers
  // keep authenticating until their redeploy lands (set by the deploy cascade).
  const validKeys = [process.env.API_KEY, process.env.API_KEY_PREVIOUS].filter(
    (key): key is string => Boolean(key)
  )
  if (validKeys.length === 0) {
    throw new Error('API_KEY is not set, set it in the convex environment!')
  }
  return apiKey !== undefined && validKeys.includes(apiKey)
    ? 'apiKey'
    : token
      ? 'viewToken'
      : identity
        ? 'authenticated'
        : 'unauthorized'
}
export const authedOrThrowQuery = customQuery(query, {
  args: {
    apiKey: v.optional(v.string()),
    viewToken: v.optional(v.id('viewTokens')),
  },
  input: async (ctx, { apiKey, viewToken }) => {
    const authStatus = await getAuthStatus(ctx, apiKey, viewToken)

    if (authStatus === 'unauthorized') {
      throw new Error('Unauthorized')
    }

    return { ctx: { ...ctx, authStatus, viewToken }, args: {} }
  },
})

export const authedOrThrowMutation = customMutation(mutation, {
  args: {
    apiKey: v.optional(v.string()),
    viewToken: v.optional(v.id('viewTokens')),
  },
  input: async (ctx, { apiKey, viewToken }) => {
    const authStatus = await getAuthStatus(ctx, apiKey, viewToken)

    if (authStatus === 'unauthorized') {
      throw new Error('Unauthorized')
    }

    return { ctx: { ...ctx, authStatus, viewToken }, args: {} }
  },
})

export const queryWithAuthStatus = customQuery(query, {
  args: {
    apiKey: v.optional(v.string()),
    viewToken: v.optional(v.id('viewTokens')),
  },
  input: async (ctx, { apiKey, viewToken }) => {
    const authStatus = await getAuthStatus(ctx, apiKey, viewToken)

    return { ctx: { ...ctx, authStatus, viewToken }, args: {} }
  },
})

export const mutationWithAuthStatus = customMutation(mutation, {
  args: {
    apiKey: v.optional(v.string()),
    viewToken: v.optional(v.id('viewTokens')),
  },
  input: async (ctx, { apiKey, viewToken }) => {
    const authStatus = await getAuthStatus(ctx, apiKey, viewToken)

    return { ctx: { ...ctx, authStatus, viewToken }, args: {} }
  },
})
