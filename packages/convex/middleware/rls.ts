import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { Rules, wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";
import { internalMutation, QueryCtx } from "../app/_generated/server.js";
import { DataModel } from "../app/_generated/dataModel.js";
import { mutation, query } from "../app/_generated/server.js";

// RLS
import { stationsRls } from "../rls/organizationSchema/stations.js";
import { usersRls } from "../rls/authSchema/users.js";
import { organizationsRls } from "../rls/organizationSchema/organizations.js";
import { departmentsRls } from "../rls/organizationSchema/departments.js";
import { rolesRls } from "../rls/authSchema/roles.js";
import { alertsRls } from "../rls/alerts.js";
import { dashboardsRls } from "../rls/dashboardSchema/dashboards.js";
import { pagesRls } from "../rls/dashboardSchema/pages.js";
import { descriptorsRls } from "../rls/configurationSchema/descriptors.js";
import { redactionLevelsRls } from "../rls/configurationSchema/redactionLevels.js";
import { unitsRls } from "../rls/configurationSchema/units.js";


export function rlsRules(_: QueryCtx): Rules<QueryCtx, DataModel> {
  return {
    // organizationSchema
    stations: stationsRls,
    organizations: organizationsRls,
    departments: departmentsRls,

    // authSchema
    users: usersRls,
    roles: rolesRls,

    //dashboardSchema
    dashboards: dashboardsRls,
    pages: pagesRls,

    // configurationSchema
    descriptors: descriptorsRls,
    redactionLevels: redactionLevelsRls,
    units: unitsRls,

    // app
    alerts: alertsRls,
  };
}

const queryWithRLS = customQuery(
  query,
  customCtx((ctx) => ({
    db: wrapDatabaseReader(ctx, ctx.db, rlsRules(ctx)),
  })),
);

const mutationWithRLS = customMutation(
  mutation,
  customCtx((ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, rlsRules(ctx)),
  })),
);

const internalMutationWithRLS = customMutation(
  internalMutation,
  customCtx((ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, rlsRules(ctx)),
  })),
);

export { queryWithRLS, mutationWithRLS, internalMutationWithRLS }

// import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
// import { Rules, wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";
// import { internalMutation, QueryCtx } from "../app/_generated/server.js";
// import { DataModel } from "../app/_generated/dataModel.js";
// import { mutation, query } from "../app/_generated/server.js";
// import { hasPermission } from "../lib/permissions.js";
// import { withAuthContext } from "../context/auth-context.js";

// export function rlsRules(_: QueryCtx): Rules<QueryCtx, DataModel> {
//   return {
//     users: {
//       read: (ctx, user) =>
//         withAuthContext(ctx, user, ({ authedUser }) => {
//           return authedUser.organization === user.organization;
//         }),
//       modify: (ctx, user) =>
//         withAuthContext(ctx, user, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["user:modify"], compare: () => authedUser.organization === user.organization });
//         }),
//       insert: (ctx, user) =>
//         withAuthContext(ctx, user, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["user:insert"], compare: () => authedUser.organization === user.organization });
//         }),
//     },

//     organizations: {
//       read: (ctx, org) =>
//         withAuthContext(ctx, org, ({ authedUser }) => {
//           return authedUser.organization === org._id;
//         }),
//       modify: (ctx, org) =>
//         withAuthContext(ctx, org, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["organization:modify"], compare: () => authedUser.organization === org._id });
//         }),
//     },

//     departments: {
//       read: (ctx, dept) =>
//         withAuthContext(ctx, dept, ({ authedUser }) => {
//           return authedUser.organization === dept.organization;
//         }),
//       modify: (ctx, dept) =>
//         withAuthContext(ctx, dept, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["department:modify"], compare: () => authedUser.organization === dept.organization });
//         }),
//       insert: (ctx, dept) =>
//         withAuthContext(ctx, dept, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["department:insert"], compare: () => authedUser.organization === dept.organization });
//         }),

//     },

//     roles: {
//       read: (ctx, role) =>
//         withAuthContext(ctx, role, ({ authedUser }) => {
//           return authedUser.organization === role.organization;
//         }),
//       modify: (ctx, role) =>
//         withAuthContext(ctx, role, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["roles:modify"], compare: () => authedUser.organization === role.organization });
//         }),
//       insert: (ctx, role) =>
//         withAuthContext(ctx, role, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["roles:insert"], compare: () => authedUser.organization === role.organization })
//         }),
//     },

//     redactionLevels: {
//       read: (ctx, role) =>
//         withAuthContext(ctx, role, ({ authedUser }) => {
//           return authedUser.departments.some(d => d._id === role.department);
//         }),
//       modify: (ctx, role) =>
//         withAuthContext(ctx, role, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["roles:modify"], compare: () => authedUser.departments.some(d => d._id === role.department) });
//         }),
//       insert: (ctx, role) =>
//         withAuthContext(ctx, role, ({ perms, authedUser }) => {
//           return hasPermission({ perms, required: ["roles:insert"], compare: () => authedUser.departments.some(d => d._id === role.department) })
//         }),
//     }
//   };
// }

// const queryWithRLS = customQuery(
//   query,
//   customCtx(async (ctx) => ({
//     db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx)),
//   })),
// );

// const mutationWithRLS = customMutation(
//   mutation,
//   customCtx(async (ctx) => ({
//     db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx)),
//   })),
// );

// const internalMutationWithRLS = customMutation(
//   internalMutation,
//   customCtx(async (ctx) => ({
//     db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx)),
//   })),
// );

// export { queryWithRLS, mutationWithRLS, internalMutationWithRLS }