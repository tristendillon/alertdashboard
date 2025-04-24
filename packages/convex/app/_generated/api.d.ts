/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as authSchema_apiKeys from "../authSchema/apiKeys.js";
import type * as authSchema_authAccounts from "../authSchema/authAccounts.js";
import type * as authSchema_roles from "../authSchema/roles.js";
import type * as authSchema_sessions from "../authSchema/sessions.js";
import type * as authSchema_users from "../authSchema/users.js";
import type * as configurationSchema_descriptors from "../configurationSchema/descriptors.js";
import type * as configurationSchema_redactionLevels from "../configurationSchema/redactionLevels.js";
import type * as configurationSchema_units from "../configurationSchema/units.js";
import type * as dashboardSchema_actions from "../dashboardSchema/actions.js";
import type * as dashboardSchema_dashboards from "../dashboardSchema/dashboards.js";
import type * as dashboardSchema_pages from "../dashboardSchema/pages.js";
import type * as http from "../http.js";
import type * as organizationSchema_departments from "../organizationSchema/departments.js";
import type * as organizationSchema_mapData from "../organizationSchema/mapData.js";
import type * as organizationSchema_mapIcons from "../organizationSchema/mapIcons.js";
import type * as organizationSchema_organizations from "../organizationSchema/organizations.js";
import type * as organizationSchema_stations from "../organizationSchema/stations.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as restraints from "../restraints.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auth: typeof auth;
  "authSchema/apiKeys": typeof authSchema_apiKeys;
  "authSchema/authAccounts": typeof authSchema_authAccounts;
  "authSchema/roles": typeof authSchema_roles;
  "authSchema/sessions": typeof authSchema_sessions;
  "authSchema/users": typeof authSchema_users;
  "configurationSchema/descriptors": typeof configurationSchema_descriptors;
  "configurationSchema/redactionLevels": typeof configurationSchema_redactionLevels;
  "configurationSchema/units": typeof configurationSchema_units;
  "dashboardSchema/actions": typeof dashboardSchema_actions;
  "dashboardSchema/dashboards": typeof dashboardSchema_dashboards;
  "dashboardSchema/pages": typeof dashboardSchema_pages;
  http: typeof http;
  "organizationSchema/departments": typeof organizationSchema_departments;
  "organizationSchema/mapData": typeof organizationSchema_mapData;
  "organizationSchema/mapIcons": typeof organizationSchema_mapIcons;
  "organizationSchema/organizations": typeof organizationSchema_organizations;
  "organizationSchema/stations": typeof organizationSchema_stations;
  rateLimiter: typeof rateLimiter;
  restraints: typeof restraints;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    public: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
  };
};
