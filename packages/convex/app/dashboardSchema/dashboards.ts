import { crud } from 'convex-helpers/server/crud'
import { queryWithRLS, mutationWithRLS } from '@workspace/convex/middleware/rls'
import schema from '../schema'
import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { Id } from '../_generated/dataModel'
import { SignJWT, importPKCS8 } from 'jose'
import { createRefreshToken } from '../authSchema/sessions'

export const createDashboardUser = internalMutation({
  args: {
    organization: v.id('organizations'),
  },
  handler: async (ctx, { organization }) => {
    const user: Id<'users'> = await ctx.runMutation(
      internal.authSchema.users.createDashboardUser,
      {
        organization,
      }
    )

    return user
  },
})

export const createDashboardTokens = internalMutation({
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
        internal.dashboardSchema.dashboards.createDashboardUser,
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

    const privateKey = await importPKCS8(process.env.JWT_PRIVATE_KEY!, 'RS256')

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

    const convexToken = await new SignJWT({
      sub: `${refreshToken}|${authSession}`,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer(process.env.CONVEX_SITE_URL)
      .setAudience('convex')
      .setExpirationTime('1h')
      .sign(privateKey)

    return {
      accessToken: convexToken,
      refreshToken: `${refreshToken}|${authSession}`,
      url: `${process.env.DASHBOARDS_URL}?token=${convexToken}&refresh=${`${refreshToken}|${authSession}`}`,
    }
  },
})

export const {
  update: updateDashboard,
  destroy: deleteDashboard,
  create: createDashboard,
  read: readDashboard,
} = crud(schema, 'dashboards', queryWithRLS, mutationWithRLS)
