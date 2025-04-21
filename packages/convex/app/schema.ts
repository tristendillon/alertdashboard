import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables as convexAuthTables } from "@convex-dev/auth/server";
import { permissionValidator } from "../lib/permissions";

const coordinates = v.object({
  latitude: v.number(),
  longitude: v.number(),
})

const alerts = defineTable({
  department: v.id("departments"),
  // Some departments might not want to have to map their units to display names
  mappedUnits: v.array(v.id("units")),
  // Some departments might not want to have to map their call descriptors for redaction.
  // They might choose for a regex redaction or another method, or to not redact at all.
  mappedDescriptor: v.id("descriptors"), // MED-Stroke, Fire-Structure. etc.
  units: v.string(),
  descriptor: v.string(),
  cadDetails: v.string(),
  city: v.string(),
  state: v.string(),
  crossStreet: v.string(), // DONDEE DR & ALLISON AVE
  address: v.string(),
  coordinates: coordinates,
  priority: v.string(), // I think this is defined differently by different CAD systems.
  place: v.string(), // This would be like "Taco Luca", "Mc Donalds", etc.

  // date in epoch ms, while we could use the creation time,
  // it might be an idea in the future to implement importing old alerts,
  // since i have an idea for showing mass alert data and stats in dashboards.
  date: v.number(),

  modifiedAt: v.number(), // modification time in epoch ms

  // So we can have a user modify the object. But we can also have the cad systems patch stuff
  // some integrations like active911 will only read the alert from RipNRun once, so any updates made
  // By dispatch will not be parsed and sent from a911
  // on the other hand, we can have integrations like firstdue patch stuff after the fact.
  // Modification by these integrations will be marked as "System"
  // we could migrate it to use their integration name in the future.
  modifiedBy: v.union(v.id("users"), v.literal("System")),


}).index("by_department", ["department"]);

const organizationTables = {
  organizations: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
  }).index("by_name", ["name"]),

  departments: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    organization: v.id("organizations"),
  }).index("by_name", ["name"]).index("by_organization", ["organization"]),

  // This is completely optional. This would serve a purpose to have given
  // dashboards exist to only certain stations.
  station: defineTable({
    name: v.string(),
    department: v.id("departments"),
    address: v.string(),
    zip: v.string(),
    coordinates: v.optional(coordinates),
    units: v.array(v.id("units")),
  }).index("by_name", ["name"]).index("by_department", ["department"]),
}

const dashboardTables = {
  // Dashboards, a given department has many dashboards.
  // Dashboards serve for what is displayed and the main entry point for seeing data.
  dashboards: defineTable({
    name: v.string(),
    department: v.id("departments"),
    // The alert page is the page that is displayed when an alert is triggered
    // It is optional and so if an alert comes it, it will not display anything new.
    alertPage: v.optional(v.id("pages")),

    // dashboardPages can be singular or many, when they are many there will be options
    // to cycle through them or select one, etc.
    dashboardPages: v.array(v.id("pages")),

    // station is optional and so if it is not set, it will be available to all stations
    // or to no stations at all if there are no stations defined.
    // Dashboards will display each station should you not have a station defined.
    station: v.optional(v.id("stations")),
    public: v.boolean(),
  }).index("by_name", ["name"]).index("by_department", ["department"]),

  // Dashboard Pages, a given dashboard has many pages, they can cycled through,
  // or selected, etc, all managed through settings
  pages: defineTable({
    name: v.string(),
    department: v.id("departments"),
  }).index("by_name", ["name"]).index("by_department", ["department"]),
}

const configurationTables = {
  redactionLevel: defineTable({
    department: v.id("departments"),
    // Something like partial, level 1, full, etc.
    level: v.string(),

    // This will look like "^MED" or "^FIRE" to match the any MED or any FIRE descriptor
    // field matches against the cadDescriptor in the mapping
    cadDescriptorRegex: v.string(),
    // This will look like "^MED" or "^FIRE" to match the any MED or any FIRE descriptor
    // field matches against the descriptor
    descriptorRegex: v.string(),

    // This will do direct matching for redaction level.
    descriptors: v.array(v.id("descriptors")),

    // The fields that are redacted from the alert when accessed by the public
    // if public facing dashboards exists
    redactionFields: v.array(v.union(alerts.validator)),
  }).index("by_department", ["department"]).index("by_level", ["level"]),

  // This table maps the descriptor so we can
  descriptors: defineTable({
    department: v.id("departments"),
    cadDescriptor: v.string(),
    descriptor: v.string(),
  }).index("by_department", ["department"]).index("by_cad_descriptor", ["cadDescriptor"]).index("by_descriptor", ["descriptor"]),

  // Say on CAD the alert comes in as "E3" but we want to display "E-3 or Engine 3"
  // This table maps the CAD unit to the display unit
  // We have some pretty deep indexing to allow us to make fast queries when building
  // mass alert data.
  units: defineTable({
    department: v.id("departments"),
    cadUnit: v.string(),
    unit: v.string(),
    shortHandUnit: v.optional(v.string()),
  }).index("by_department", ["department"]).index("by_cad_unit", ["cadUnit"]).index("by_unit", ["unit"]),
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
  alerts,
  ...organizationTables,
  ...dashboardTables,
  ...authTables,
  ...configurationTables,
});
