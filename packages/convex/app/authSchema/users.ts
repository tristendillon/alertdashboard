import { crud } from 'convex-helpers/server/crud'
import { mutationWithRLS, queryWithRLS } from '../../middleware/rls.js'
import schema from '../schema.js'
import { internalMutation, internalQuery, query } from '../_generated/server.js'
import { v } from 'convex/values'
import {
  mutationWithAuthedUser,
  queryWithAuthedUser,
} from '../../middleware/user.js'
import { partial } from 'convex-helpers/validators'
import { doc } from 'convex-helpers/validators'
import { ConvexError } from 'convex/values'
import { internal } from '@workspace/convex/app/_generated/api'
import { generateSecureKey } from '../../utils/keys'

export const me = queryWithAuthedUser({
  handler: async (ctx) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', ctx.authedUser.email))
      .first()
    return user
  },
})

export const createUser = mutationWithRLS({
  args: {
    email: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    organization: v.id('organizations'),
  },
  handler: async (
    ctx,
    { email, password, confirmPassword, firstName, lastName, organization }
  ) => {
    if (password !== confirmPassword) {
      throw new ConvexError('Passwords do not match.')
    }
    const user = await ctx.db.insert('users', {
      email,
      firstName,
      lastName,
      organization,
    })
    await ctx.runMutation(internal.authSchema.authAccounts.createAuthAccount, {
      providerAccountId: email,
      password,
      userId: user,
    })
    return user
  },
})

// This might actually be better as an Action
// I dont know what actions are though.
export const emailTaken = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    return !!user
  },
})

export const updateMe = mutationWithAuthedUser({
  args: {
    patch: v.object({
      ...partial(doc(schema, 'users').fields),
    }),
  },
  handler: async ({ db, authedUser }, { patch }) => {
    const updatedUser = await db.patch(authedUser._id, patch)
    return updatedUser
  },
})

export const readUsers = queryWithRLS({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    return users
  },
})

export const getUserById = internalQuery({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})
export const createDashboardUser = internalMutation({
  args: {
    organization: v.id('organizations'),
  },
  handler: async (ctx, { organization }) => {
    const user = await ctx.db.insert('users', {
      email: `temp@alertdashboard.dashboard.com`,
      firstName: `temp`,
      lastName: `temp`,
      organization,
    })
    await ctx.db.patch(user, {
      email: `${user}@alertdashboard.dashboard.com`,
      firstName: `first_${user}`,
      lastName: `last_${user}`,
      organization,
    })
    const password = generateSecureKey(64)
    await ctx.runMutation(internal.authSchema.authAccounts.createAuthAccount, {
      providerAccountId: `${user}@alertdashboard.dashboard.com`,
      password,
      userId: user,
    })
    return user
  },
})

export const getDashboardUser = internalQuery({
  args: {
    organization: v.id('organizations'),
  },
  handler: async (ctx, { organization }) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_organization', (q) => q.eq('organization', organization))
      .collect()
    return users.find((user) =>
      user.email.includes('@alertdashboard.dashboard.com')
    )
  },
})
export const {
  update: updateUser,
  destroy: deleteUser,
  read: readUser,
} = crud(schema, 'users', queryWithRLS, mutationWithRLS)
