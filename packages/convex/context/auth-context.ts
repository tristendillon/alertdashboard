import { QueryCtx } from "../app/_generated/server.js";
import { getUserPermissions } from "../lib/permissions.js";
import { getUserFromIdentityCtx } from "../utils/users.js";

type AuthContext<Data> = {
  ctx: QueryCtx;
  authedUser: NonNullable<Awaited<ReturnType<typeof getUserFromIdentityCtx>>>;
  perms: Awaited<ReturnType<typeof getUserPermissions>>;
  data: Data;
};

async function withAuthContext<Data>(
  ctx: QueryCtx,
  data: Data,
  handler: (args: AuthContext<Data>) => boolean
): Promise<boolean> {
  const authedUser = await getUserFromIdentityCtx(ctx);
  if (!authedUser) return false;

  const perms = await getUserPermissions(authedUser, ctx);
  return handler({ ctx, authedUser, perms, data });
}

export { withAuthContext, type AuthContext };
