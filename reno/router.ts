import { writeCookies } from "./cookies.ts";
import parsePath from "./pathparser.ts";

/**
 * The standard request type used througout Reno, which
 * is passed to user-defined route handler functions.
 * Mostly identical to std/http's ServerRequest, except the
 * inclusion of Reno-specific props for ease of use.
 */
export type AugmentedRequest = Request & {
  pathname: string;
  queryParams: URLSearchParams;
  routeParams: string[];
};

/**
 * The standard response type returned by route handler functions.
 * Essentially the same as std/http's Response, but also exposes
 * cookies as an array of [string, string] tuples.
 */
export type AugmentedResponse = Response & {
  cookies?: [string, string][];
};

/**
 * The router function returned by `createRouter`
 * that is intended to be invoked when a HTTP
 * server receives a request. */
export type Router = (
  req: Request,
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
 * const notFound = (e: MissingRouteError) => createErrorResponse(404, e);
 * const serverError = (e: Error) => createErrorResponse(500, e);
 *
 * const mapToErrorResponse = (e: Error) =>
 *   e instanceof MissingRouteError ? notFound(e) : serverError(e);
 * ```
 */
export class MissingRouteError extends Error {
  constructor(pathname: string) {
    super(`No match for ${pathname}`);
  }
}

/**
 * Creates a `RouteMap`, a `Map` that holds route handling functions
 * and keys them by the path by which the router will make them
 * accessible:
 *
 * ```ts
 * export const routes = createRouteMap([
 *   ["/home", () => new Response("Hello world!")],
 *
 *   // Supports RegExp routes for further granularity
 *   [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
 *     const [quotesCount = "1"] = req.routeParams;
 *
 *     const res = await fetch(
 *       `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
 *     );
 *
 *     return jsonResponse(await res.json());
 *   }],
 * ]);
 * ```
 */
export function createRouteMap(routes: [RegExp | string, RouteHandler][]) {
  return new Map(routes);
}

function isAugmentedRequest(
  req: Request | AugmentedRequest,
): req is AugmentedRequest {
  return "pathname" in req;
}

export function createAugmentedRequest(
  req: Request | AugmentedRequest,
  queryParams: URLSearchParams,
  routeParams: string[],
) {
  /* We use Object.assign() instead of spreading
   * the original request into a new object, as the
   * methods of the Request type are not enumerable. */
  return Object.assign(req, {
    pathname: getPathname(req),
    queryParams,
    routeParams,
  });
}

function getPathname(req: Request | AugmentedRequest) {
  return isAugmentedRequest(req) ? req.pathname : new URL(req.url).pathname;
}

export function routerCreator(
  pathParser: typeof parsePath,
  cookieWriter: typeof writeCookies,
) {
  return (routes: RouteMap) =>
    async (
      req: Request | AugmentedRequest,
      rootQueryParams?: URLSearchParams,
      childPathParts?: string[],
    ) => {
      const url = new URL(
        childPathParts ? childPathParts.join("/") : req.url,
        "https://undefined", // real value not required for relative path parsing
      );
      const queryParams = rootQueryParams || url.searchParams;

      /* TODO: restructure this lookup to support O(1) retrieval.
       * Perhaps precompute a radix tree or a similar structure. */
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

      return Promise.reject(new MissingRouteError(getPathname(req)));
    };
}

/**
 * Creates a Reno router for the given routes, which
 * can then be invoked as an async function when
 * Deno's HTTP server receives a request:
 *
 * ```ts
 * import { listenAndServe } from "https://deno.land/std@0.116.0/http/server.ts";
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
 *   async req => {
 *     try {
 *       return await router(req);
 *     } catch (e) {
 *       return mapToErrorResponse(e);
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
