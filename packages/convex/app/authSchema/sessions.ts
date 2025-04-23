import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

function getExpirationTime(sessionLength: number | null) {
  if (sessionLength) {
    return Date.now() + 1000 * 60 * 60 * 24 * sessionLength
  } else {
    return Date.now() + 1000 * 60 * 60 * 24 * 365 * 100 // 100 years
  }
}

export const createRefreshToken = internalMutation({
  args: {
    sessionId: v.id('authSessions'),
    sessionLength: v.union(
      v.literal(30),
      v.literal(180),
      v.literal(365),
      v.null()
    ),
  },
  handler: async (ctx, { sessionId, sessionLength }) => {
    const expirationTime = getExpirationTime(sessionLength)
    const refreshToken = await ctx.db.insert('authRefreshTokens', {
      sessionId,
      expirationTime,
    })
    return refreshToken
  },
})

export const deleteRefreshToken = internalMutation({
  args: {
    refreshTokenId: v.id('authRefreshTokens'),
  },
  handler: async (ctx, { refreshTokenId }) => {
    await ctx.db.delete(refreshTokenId)
  },
})

export const getRefreshTokensBySession = internalQuery({
  args: {
    sessionId: v.id('authSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query('authRefreshTokens')
      .withIndex('sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()
  },
})
export const deleteSession = internalMutation({
  args: {
    sessionId: v.id('authSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.delete(sessionId)
  },
})
export const getSessionByUserId = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .first()
    return session
  },
})
export const createAuthSession = internalMutation({
  args: {
    userId: v.id('users'),
    sessionLength: v.union(
      v.literal(30),
      v.literal(180),
      v.literal(365),
      v.null()
    ),
  },
  handler: async (ctx, { userId, sessionLength }) => {
    const expirationTime = getExpirationTime(sessionLength)
    const authSession = await ctx.db.insert('authSessions', {
      userId,
      expirationTime,
    })

    return authSession
  },
})
