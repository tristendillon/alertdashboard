import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  messages: defineTable({
    text: v.string(),
    author: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  authors: defineTable({
    name: v.string(),
    avatarUrl: v.string(),
  }).index("by_name", ["name"]),
};



export default defineSchema({
  ...authTables,
  ...applicationTables,
});
