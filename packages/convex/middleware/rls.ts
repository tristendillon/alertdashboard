import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import {
  Rules,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from 'convex-helpers/server/rowLevelSecurity'
import {
  internalMutation,
  QueryCtx,
} from '@workspace/convex/app/_generated/server.js'
import { DataModel } from '@workspace/convex/app/_generated/dataModel.js'
import { mutation, query } from '@workspace/convex/app/_generated/server.js'

// RLS
import {
  usersRls,
  rolesRls,
  apiKeysRls,
} from '@workspace/convex/rls/authSchema/index.js'
import {
  stationsRls,
  organizationsRls,
  departmentsRls,
} from '@workspace/convex/rls/organizationSchema/index.js'
import {
  dashboardsRls,
  pagesRls,
} from '@workspace/convex/rls/dashboardSchema/index.js'
import {
  descriptorsRls,
  redactionLevelsRls,
  unitsRls,
  mapDataRls,
  mapDataTemplatesRls,
  mapIconsRls,
} from '@workspace/convex/rls/configurationSchema/index.js'
import { alertsRls } from '@workspace/convex/rls/alerts.js'

export function rlsRules(_: QueryCtx): Rules<QueryCtx, DataModel> {
  return {
    // organizationSchema
    stations: stationsRls,
    organizations: organizationsRls,
    departments: departmentsRls,

    // authSchema
    users: usersRls,
    roles: rolesRls,
    apiKeys: apiKeysRls,

    //dashboardSchema
    dashboards: dashboardsRls,
    pages: pagesRls,

    // configurationSchema
    descriptors: descriptorsRls,
    redactionLevels: redactionLevelsRls,
    units: unitsRls,
    mapDataTemplates: mapDataTemplatesRls,
    mapData: mapDataRls,
    mapIcons: mapIconsRls,

    // app
    alerts: alertsRls,
  }
}

const queryWithRLS = customQuery(
  query,
  customCtx((ctx) => ({
    db: wrapDatabaseReader(ctx, ctx.db, rlsRules(ctx)),
  }))
)

const mutationWithRLS = customMutation(
  mutation,
  customCtx((ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, rlsRules(ctx)),
  }))
)

const internalMutationWithRLS = customMutation(
  internalMutation,
  customCtx((ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, rlsRules(ctx)),
  }))
)

export { queryWithRLS, mutationWithRLS, internalMutationWithRLS }
