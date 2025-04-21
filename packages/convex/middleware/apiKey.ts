import { customMutation } from "convex-helpers/server/customFunctions";
import { internalMutation } from "../app/_generated/server.js";
import { v } from "convex/values";

export const mutationWithApiKey = customMutation(internalMutation, {
  args: { apiKey: v.string() },
  input: async (_, { apiKey }) => {
    return { ctx: {}, args: { apiKey } };
  },
});