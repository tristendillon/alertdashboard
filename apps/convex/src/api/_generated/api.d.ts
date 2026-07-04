/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as customization from "../customization.js";
import type * as dispatches from "../dispatches.js";
import type * as hydrants from "../hydrants.js";
import type * as index from "../index.js";
import type * as transformations from "../transformations.js";
import type * as viewToken from "../viewToken.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type { ComponentApi as GeospatialComponentApi } from "@convex-dev/geospatial/_generated/component.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  customization: typeof customization;
  dispatches: typeof dispatches;
  hydrants: typeof hydrants;
  index: typeof index;
  transformations: typeof transformations;
  viewToken: typeof viewToken;
  weather: typeof weather;
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
  geospatial: GeospatialComponentApi;
};
