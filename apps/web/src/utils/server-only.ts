"server only";

import { env } from "@/env";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { fetchQuery } from "convex/nextjs";
import z from "zod";

const viewTokenSchema = z.string().uuid();

type TokenIdPageParams = Promise<{ viewToken?: string[] }>;

export const getTokenIdFromParams = async (params: TokenIdPageParams) => {
  const awaited = await params;
  if (!awaited.viewToken || awaited.viewToken.length === 0) {
    return {
      data: undefined,
      error: undefined,
    };
  }
  const viewToken = awaited.viewToken[0];
  const { error } = viewTokenSchema.safeParse(viewToken);
  if (error && viewToken) {
    return {
      data: undefined,
      error: error.issues.map((issue) => issue.message).join(", "),
    };
  }

  if (viewToken) {
    const viewTokenData = await fetchQuery(api.viewToken.getViewToken, {
      token: viewToken,
      apiKey: env.CONVEX_API_KEY,
    });
    return {
      data: viewTokenData?._id as Id<"viewTokens">,
      error: undefined,
    };
  }
  return {
    data: undefined,
    error: "Invalid View Token",
  };
};
