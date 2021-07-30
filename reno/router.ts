import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.101.0/http/server.ts";

import { writeCookies } from "./cookies.ts";
import parsePath from "./pathparser.ts";

/**
 * The standard request type used througout Reno, which
 * is passed to user-defined route handler functions.
 * Mostly identical to std/http's ServerRequest, except:
 * - the `respond` method is excluded as it shouldn't be invoked within Reno apps
 * - Reno-specific props for query params and route params are exposed
 */
export type AugmentedRequest =
  & Pick<
    ServerRequest,
    Exclude<keyof ServerRequest, "respond" | "done">
  >
  & {
    queryParams: URLSearchParams;
    routeParams: string[];
  };

/**
 * The standard response type returned by route handler functions.
 * Essentially the same as std/http's Response, but also exposes
 * cookies as a `Map`
 */
export type AugmentedResponse = Response & {
  // TODO: make 2D tuple to abstract Map instantiation
  cookies?: Map<string, string>;
};

/**
 * The router function returned by `createRouter`
 * that is intended to be invoked when a HTTP
 * server receives a request. */
export type Router = (
  req: ServerRequest,
) => AugmentedResponse | Promise<AugmentedResponse>;

/**
 * A user-defined route handler for a particular route.
 */
export type RouteHandler<TRequest = AugmentedRequest> = (
  req: TRequest,
  rootQueryParams?: URLSearchParams,
  childPathParts?: string[],
) => Response | Promise<Response>;

/**
 * A function that takes a routes map and
 * returns an invocable router function.
 */
export type RouterCreator = (routes: RouteMap) => Router;

/**
 * A standard ECMAScript `Map` that holds route handler
 * functions that are keyed by either RegExps or strings.
 */
export type RouteMap = Map<RegExp | string, RouteHandler>;

/**
 * An error that's thrown by Reno when a route
 * for a particular request's path cannot be found in the
 * router's route map. You won't need to instantiate and
 * throw this directly, but it's exported to support
 * `instanceof` checks in error handling logic:
 *
 * ```ts
 * const notFound = (e: NotFoundError) => createErrorResponse(404, e);
 * const serverError = (e: Error) => createErrorResponse(500, e);
 *
 * const mapToErrorResponse = (e: Error) =>
 *   e instanceof NotFoundError ? notFound(e) : serverError(e);
 * ```
 */
export class NotFoundError extends Error {} // TODO: rename RouteMissingError?

/**
 * Creates a `RouteMap`, a `Map` that holds route handling functions
 * and keys them by the path by which the router will make them
 * accessible:
 * ```ts
 * export const routes = createRouteMap([
 *   ["/home", () => textResponse("Hello world!")],
 *
 *   // Supports RegExp routes for further granularity
 *   [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
 *     const [quotesCount = "1"] = req.routeParams;
 *
 *     const res = await fetch(
 *       `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
 *    );
 *
 *     return jsonResponse(await res.json());
 *   }],
 * ]);
 * ```
 */
export function createRouteMap(routes: [RegExp | string, RouteHandler][]) {
  return new Map(routes);
}

export function createAugmentedRequest(
  { body, contentLength, finalize, ...rest }: ServerRequest | AugmentedRequest,
  queryParams: URLSearchParams,
  routeParams: string[],
) {
  return {
    ...rest,
    body,
    queryParams,
    routeParams,
    contentLength,
    finalize,
  };
}

export function routerCreator(
  pathParser: typeof parsePath,
  cookieWriter: typeof writeCookies,
) {
  return (routes: RouteMap) =>
    async (
      req: ServerRequest | AugmentedRequest,
      rootQueryParams?: URLSearchParams,
      childPathParts?: string[],
    ) => {
      const url = new URL(
        childPathParts ? childPathParts.join("/") : req.url,
        "https://undefined", // real value not required for relative path parsing
      );
      const queryParams = rootQueryParams || url.searchParams;

      /* TODO: restructure this lookup to support O(1) retrieval.
       * Perhaps compute a radix tree or a similar structure. */
      for (const [path, handler] of routes) {
        const [firstMatch, ...restMatches] =
          url.pathname.match(pathParser(path)) || [];

        if (firstMatch) {
          const res = await handler(
            createAugmentedRequest(req, queryParams, restMatches),
            queryParams,
            restMatches,
          );

          cookieWriter(res);

          return res;
        }
      }

      return Promise.reject(new NotFoundError(`No match for ${req.url}`));
    };
}

/**
 * Creates a Reno router for the given routes, which
 * can then be invoked as an async function when
 * Deno's HTTP server receives a request:
 *
 * ```ts
 * import {
 *   ServerRequest,
 *   listenAndServe,
 * } from "https://deno.land/std@0.101.0/http/server.ts";

 * import { createRouter } from "https://deno.land/x/reno@<VERSION>/reno/mod.ts";
 * import { routes } from "./routes.ts";
 *
 * const BINDING = ":8000";
 *
 * const router = createRouter(routes);
 *
 * console.log(`Listening for requests on ${BINDING}...`);
 *
 * await listenAndServe(
 *   BINDING,
 *   async (req: ServerRequest) => {
 *     logRequest(req);
 *
 *     try {
 *       const res = await router(req);
 *       return req.respond(res);
 *     } catch (e) {
 *       return req.respond(mapToErrorResponse(e));
 *     }
 *   },
 * );
 * ```
 */
export function createRouter(routes: RouteMap) {
  /* We could just do `const createRouter = routerCreator(parsePath, writeCookies)`
   * here, but sadly deno doc isn't able to surface it as a function :( */
  return routerCreator(parsePath, writeCookies)(routes);
}
