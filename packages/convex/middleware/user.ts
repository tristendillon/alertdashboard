import { customQuery, customMutation, customCtx } from 'convex-helpers/server/customFunctions';
import { getUserFromIdentityCtx } from '../utils/users.js';
import { mutation, query, QueryCtx } from '../app/_generated/server.js';
import { wrapDatabaseReader } from 'convex-helpers/server/rowLevelSecurity';
import { wrapDatabaseWriter } from 'convex-helpers/server/rowLevelSecurity';
import { rlsRules } from './rls.js';


const authedUserCtx = customCtx(async (ctx: QueryCtx) => {
  const authedUser = await getUserFromIdentityCtx(ctx);
  if (!authedUser) {
    throw new Error("Unauthenticated"); // or return null if optional
  }

  return { authedUser };
});


export const queryWithAuthedUser = customQuery(query, authedUserCtx);
export const mutationWithAuthedUser = customMutation(mutation, authedUserCtx);

const queryWithRLSAndUser = customQuery(
  query,
  customCtx(async (ctx) => {
    const authedUser = await getUserFromIdentityCtx(ctx);
    if (!authedUser) throw new Error("Unauthenticated");

    const db = wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx));
    return { db, authedUser };
  })
);

const mutationWithRLSAndUser = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const authedUser = await getUserFromIdentityCtx(ctx);
    if (!authedUser) throw new Error("Unauthenticated");

    const db = wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx));
    return { db, authedUser };
  })
);

export { queryWithRLSAndUser, mutationWithRLSAndUser };
