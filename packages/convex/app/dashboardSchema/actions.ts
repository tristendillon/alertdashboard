'use node'

import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { Id } from '../_generated/dataModel'
import jose from 'node-jose'

export const createDashboardTokens = internalAction({
  args: {
    dashboardUserId: v.optional(v.id('users')),
    organizationId: v.id('organizations'),
    sessionLength: v.union(
      v.literal(30),
      v.literal(180),
      v.literal(365),
      v.null()
    ),
  },
  handler: async (ctx, { organizationId, sessionLength }) => {
    let userId: Id<'users'> | null = null
    const dashboardUser = await ctx.runQuery(
      internal.authSchema.users.getDashboardUser,
      {
        organization: organizationId,
      }
    )

    if (!dashboardUser) {
      userId = await ctx.runMutation(
        internal.authSchema.users.createDashboardUser,
        {
          organization: organizationId,
        }
      )
    } else {
      userId = dashboardUser._id
    }

    if (!process.env.JWT_PRIVATE_KEY) {
      throw new Error('JWT_PRIVATE_KEY is not set')
    }

    if (!process.env.CONVEX_SITE_URL) {
      throw new Error('CONVEX_SITE_URL is not set')
    }

    const session = await ctx.runQuery(
      internal.authSchema.sessions.getSessionByUserId,
      {
        userId,
      }
    )

    if (session) {
      await ctx.runMutation(internal.authSchema.sessions.deleteSession, {
        sessionId: session._id,
      })
      const refreshTokens = await ctx.runQuery(
        internal.authSchema.sessions.getRefreshTokensBySession,
        {
          sessionId: session._id,
        }
      )
      for (const refreshToken of refreshTokens) {
        await ctx.runMutation(internal.authSchema.sessions.deleteRefreshToken, {
          refreshTokenId: refreshToken._id,
        })
      }
    }

    const authSession: Id<'authSessions'> = await ctx.runMutation(
      internal.authSchema.sessions.createAuthSession,
      {
        userId,
        sessionLength,
      }
    )

    const refreshToken: Id<'authRefreshTokens'> = await ctx.runMutation(
      internal.authSchema.sessions.createRefreshToken,
      {
        sessionId: authSession,
        sessionLength,
      }
    )

    const payload = {
      sub: `${refreshToken}|${authSession}`,
      iss: process.env.CONVEX_SITE_URL,
      aud: 'convex',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }

    const input = Buffer.from(JSON.stringify(payload))
    const rawKey = await jose.JWK.asKey(process.env.JWT_PRIVATE_KEY!, 'pem')

    const convexToken = await jose.JWS.createSign(
      { format: 'compact', fields: {}, alg: 'RS256' },
      { key: rawKey, reference: false }
    )
      .update(input)
      .final()

    return {
      accessToken: convexToken,
      refreshToken: `${refreshToken}|${authSession}`,
      url: `${process.env.DASHBOARDS_URL}?token=${convexToken}&refresh=${`${refreshToken}|${authSession}`}`,
    }
  },
})
