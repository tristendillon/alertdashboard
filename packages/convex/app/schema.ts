import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables as convexAuthTables } from "@convex-dev/auth/server";
import { permissionValidator } from "../lib/permissions";

const applicationTables = {
  organizations: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
  }).index("by_name", ["name"]),

  departments: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    organization: v.id("organizations"),
  }).index("by_name", ["name"]).index("by_organization", ["organization"]),
};

const authTables = {
  ...convexAuthTables,
  roles: defineTable({
    name: v.string(),
    organization: v.id("organizations"),
    permissions: v.array(permissionValidator),
  }).index("by_name", ["name"]),
  users: defineTable({
    organization: v.id("organizations"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(v.id("roles")),
    userPermissions: v.optional(v.array(v.id("permissions"))),
  }).index("email", ["email"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
