import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation } from "../app/_generated/server.js";
import { v } from "convex/values";

export const mutationWithApiKey = customMutation(mutation, {
  args: { apiKey: v.string(), organization: v.id("organizations"), department: v.id("departments") },
  input: async (_, { apiKey, organization, department }) => {
    return { ctx: {}, args: { apiKey, organization, department } };
  },
});