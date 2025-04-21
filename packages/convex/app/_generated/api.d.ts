/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as authSchema_authAccounts from "../authSchema/authAccounts.js";
import type * as authSchema_roles from "../authSchema/roles.js";
import type * as authSchema_users from "../authSchema/users.js";
import type * as http from "../http.js";
import type * as organizationSchema_departments from "../organizationSchema/departments.js";
import type * as organizationSchema_organizations from "../organizationSchema/organizations.js";

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
  "authSchema/authAccounts": typeof authSchema_authAccounts;
  "authSchema/roles": typeof authSchema_roles;
  "authSchema/users": typeof authSchema_users;
  http: typeof http;
  "organizationSchema/departments": typeof organizationSchema_departments;
  "organizationSchema/organizations": typeof organizationSchema_organizations;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
