/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as calendars_mutations from "../calendars/mutations.js";
import type * as calendars_queries from "../calendars/queries.js";
import type * as http from "../http.js";
import type * as shares_mutations from "../shares/mutations.js";
import type * as shares_queries from "../shares/queries.js";
import type * as tables_calendars from "../tables/calendars.js";
import type * as tables_events from "../tables/events.js";
import type * as tables_shares from "../tables/shares.js";
import type * as tables_user from "../tables/user.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  calendar: typeof calendar;
  "calendars/mutations": typeof calendars_mutations;
  "calendars/queries": typeof calendars_queries;
  http: typeof http;
  "shares/mutations": typeof shares_mutations;
  "shares/queries": typeof shares_queries;
  "tables/calendars": typeof tables_calendars;
  "tables/events": typeof tables_events;
  "tables/shares": typeof tables_shares;
  "tables/user": typeof tables_user;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
