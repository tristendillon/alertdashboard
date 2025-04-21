import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { ActionCtx, query } from "./_generated/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { DataModel, Id } from "./_generated/dataModel";
import { internal } from "@workspace/convex/app/_generated/api";

function signUpFlow(params: Record<string, any>, ctx: ActionCtx) {
  // Validate required fields
  const { email, password, confirmPassword, firstName, lastName, organizationId } = params;

  if (!email || !password || !confirmPassword || !firstName || !lastName || !organizationId) {
    throw new ConvexError("All fields are required");
  }

  // Validate password match
  if (password !== confirmPassword) {
    throw new ConvexError("Passwords do not match");
  }

  // Verify organization exists
  ctx.runQuery(internal.organizations.organizationExist, { id: organizationId as Id<"organizations"> }).then((exists) => {
    if (!exists) {
      throw new ConvexError("Organization does not exist");
    }
  });

  // Return profile with additional fields
  return {
    email: email as string,
    firstName: firstName as string,
    lastName: lastName as string,
    organization: organizationId as string
  };
}

function signInFlow(params: Record<string, any>, ctx: ActionCtx) {
  // Validate required fields
  const { email, password } = params;

  if (!email || !password) {
    throw new ConvexError("All fields are required");
  }

  // Return profile with additional fields
  return {
    email: email as string,
  };
}


const CustomPassword = Password<DataModel>({
  // @ts-ignore
  profile: (params, ctx) => {
    switch (params.flow) {
      case "signUp":
        return signUpFlow(params, ctx);
      case "signIn":
        return signInFlow(params, ctx);
      default:
        return undefined;
    }
  },

  validatePasswordRequirements: (password) => {
    // Add your password validation logic here
    if (password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters");
    }
  }
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});

// We don't change this to use queryWithAuthedUser
// Since we want to be able to query the loggedInUser
// Without getting an error.
export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});