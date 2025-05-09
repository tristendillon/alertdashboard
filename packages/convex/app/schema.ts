import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables as convexAuthTables } from '@convex-dev/auth/server'
import { permissionValidator } from '../lib/permissions'

const coordinates = v.object({
  latitude: v.number(),
  longitude: v.number(),
})

const alerts = defineTable({
  department: v.union(v.literal('ALL'), v.id('departments')),
  organization: v.id('organizations'),
  // Some departments might not want to have to map their units to display names
  mappedUnits: v.array(v.id('units')),
  // Some departments might not want to have to map their call descriptors for redaction.
  // They might choose for a regex redaction or another method, or to not redact at all.
  mappedDescriptor: v.optional(v.id('descriptors')), // MED-Stroke, Fire-Structure. etc.
  units: v.string(),
  descriptor: v.string(),
  cadDetails: v.string(),
  cadId: v.string(),
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
  modifiedBy: v.union(v.id('users'), v.literal('System')),
})
  .index('by_department', ['department'])
  .index('by_organization', ['organization'])

const organizationTables = {
  organizations: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
  }).index('by_name', ['name']),

  departments: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    organization: v.id('organizations'),
  })
    .index('by_name', ['name'])
    .index('by_organization', ['organization']),

  // This is completely optional. This would serve a purpose to have given
  // dashboards exist to only certain stations.
  stations: defineTable({
    name: v.string(),
    department: v.id('departments'),
    address: v.string(),
    zip: v.string(),
    coordinates: v.optional(coordinates),
    units: v.array(v.id('units')),
  })
    .index('by_name', ['name'])
    .index('by_department', ['department']),
}

const dashboardTables = {
  // Dashboards, a given department has many dashboards.
  // Dashboards serve for what is displayed and the main entry point for seeing data.
  dashboards: defineTable({
    name: v.string(),
    department: v.union(v.literal('ALL'), v.id('departments')),
    // The alert page is the page that is displayed when an alert is triggered
    // It is optional and so if an alert comes it, it will not display anything new.
    alertPage: v.optional(v.id('pages')),

    // dashboardPages can be singular or many, when they are many there will be options
    // to cycle through them or select one, etc.
    dashboardPages: v.array(v.id('pages')),

    // station is optional and so if it is not set, it will be available to all stations
    // or to no stations at all if there are no stations defined.
    // Dashboards will display each station should you not have a station defined.
    station: v.optional(v.id('stations')),
    public: v.boolean(),
  })
    .index('by_name', ['name'])
    .index('by_department', ['department']),

  // Dashboard Pages, a given dashboard has many pages, they can cycled through,
  // or selected, etc, all managed through settings
  pages: defineTable({
    department: v.id('departments'),
    name: v.string(),
  })
    .index('by_name', ['name'])
    .index('by_department', ['department']),

  // We will get into this when we have a system for creating custom pages... For now pages will be templates
  // drafts: defineTable({
  //   department: v.id("departments"),
  //   name: v.string(),
  // }).index("by_name", ["name"]).index("by_department", ["department"]),
}

const configurationTables = {
  // So we can have a objects that people can create and use on the dashboards...
  // We can default to each department starting with a set of pre defined objects
  // Like Fire Hydrants of multi colors for different flow rates, etc.
  mapIcons: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    name: v.string(),
    icon: v.string(), // This will be some SVG file stored in the file blob, so they can upload their own icons or use our built in ones.
    color: v.string(),
  })
    .index('by_department', ['department'])
    .index('by_organization', ['organization']),

  // We can let people create their own map data templates, so when adding a piece of mapData
  // They dont have to copy and paste or redefine stuff.

  // Someone could make a Fire Hydrant template.
  // It would have an icon calculation of [{someMapIconId: "flow_rate gte 500"}, {someMapIconId: "flow_rate gte 1000"}]
  // It would have an icon calculation fallback of someMapIconId
  // It would could data like {flow_rate: null, address: null, prefilled_data: "some prefilled data", prefilled_data2: 1234}
  // Then when someone creates a new mapData piece, they can select the template and it will prefill the data for them.
  // all they would have to is add the coordinates and fill in the data that is null in the data field and it would just work.
  mapDataTemplates: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    name: v.string(),
    iconCalculation: v.array(v.record(v.id('mapIcons'), v.string())),
    iconCalculationFallback: v.optional(v.id('mapIcons')),
    data: v.record(v.string(), v.union(v.string(), v.number(), v.null())),
    public: v.boolean(),
  })
    .index('by_department', ['department'])
    .index('by_organization', ['organization']),

  mapData: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    name: v.string(),
    // We can use the map to display just one icon
    icon: v.optional(v.id('mapIcons')),

    // I am going to define a way to calculate what icon to display based on a calculation of the data stored
    // Lets say we have the record "flow_rate": 1234 stored in a given mapData piece.
    // If we have a calculation like using OData syntax, e.g., [{someMapIconId: "flow_rate gte 1000"}], we can display a someMapIconId

    // So in some way it would look like data["flow_rate"] >= 1000 as a very pseudo code example to see if we use that icon id

    // On the front end of things we would pull all of the mapIcons in the keys of the calculation to have them available to display.
    // Then we would assign it based on the data of the mapIcon piece.

    // This system will be more flexible in the future when more map icons are available to the organization/department.
    iconCalculation: v.array(v.record(v.id('mapIcons'), v.string())),

    // If the calculation fails, we can fallback to a default icon if this is not set it will try to use the "icon" field.
    // Should that field also be undefined we will show a default icon on the frontend to make sure icons are always displayed.
    iconCalculationFallback: v.optional(v.id('mapIcons')),
    coordinates: coordinates,
    public: v.boolean(),

    // We can store more information in here like the type of hydrant, flow rate etc.
    data: v.record(v.string(), v.union(v.string(), v.number())),
  })
    .index('by_department', ['department'])
    .index('by_organization', ['organization']),

  redactionLevels: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    // Something like partial, level 1, full, etc.
    name: v.string(),

    // This will look like "^MED" or "^FIRE" to match the any MED or any FIRE descriptor
    // field matches against the cadDescriptor in the mapping
    cadDescriptorRegex: v.string(),
    // This will look like "^MED" or "^FIRE" to match the any MED or any FIRE descriptor
    // field matches against the descriptor
    descriptorRegex: v.string(),
    // This will search for keywords in the descriptor of the cad alert
    keywords: v.array(v.string()),
    // This will do direct matching for redaction level.
    descriptors: v.array(v.id('descriptors')),

    // The fields that are redacted from the alert when accessed by the public
    // if public facing dashboards exists
    redactionFields: v.array(v.string()),
  })
    .index('by_organization', ['organization'])
    .index('by_department', ['department'])
    .index('by_name', ['name']),

  // This table maps the descriptor so we can
  descriptors: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    cadDescriptor: v.string(),
    descriptor: v.optional(v.string()),
  })
    .index('by_organization', ['organization'])
    .index('by_department', ['department'])
    .index('by_cad_descriptor', ['cadDescriptor'])
    .index('by_descriptor', ['descriptor']),

  // Say on CAD the alert comes in as "E3" but we want to display "E-3 or Engine 3"
  // This table maps the CAD unit to the display unit
  // We have some pretty deep indexing to allow us to make fast queries when building
  // mass alert data.
  units: defineTable({
    organization: v.id('organizations'),
    department: v.id('departments'),
    cadUnit: v.string(),
    unit: v.string(),
  })
    .index('by_organization', ['organization'])
    .index('by_department', ['department'])
    .index('by_cad_unit', ['cadUnit'])
    .index('by_unit', ['unit']),
}

const authTables = {
  ...convexAuthTables,

  apiKeys: defineTable({
    organization: v.id('organizations'),
    department: v.union(v.literal('ALL'), v.id('departments')),

    // Preview of the first few letters of the key since we don't ever show the key again.
    keyPreview: v.string(),
    hash: v.string(),
    permissions: v.array(permissionValidator),
    modifiedAt: v.number(),
    modifiedBy: v.id('users'),
  })
    .index('by_organization', ['organization'])
    .index('by_department', ['department'])
    .index('by_hash', ['hash']),

  roles: defineTable({
    name: v.string(),
    organization: v.id('organizations'),
    permissions: v.array(permissionValidator),
  })
    .index('by_name', ['name'])
    .index('by_organization', ['organization']),

  users: defineTable({
    organization: v.id('organizations'),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(v.id('roles')),
    userPermissions: v.optional(v.array(v.id('permissions'))),
  })
    .index('by_email', ['email'])
    .index('by_organization', ['organization']),
}

export default defineSchema({
  alerts,
  ...organizationTables,
  ...dashboardTables,
  ...authTables,
  ...configurationTables,
})
