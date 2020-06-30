import {
  ServerRequest,
  Response,
} from "https://deno.land/std@v0.58.0/http/server.ts";

import { writeCookies } from "./cookies.ts";
import parsePath from "./pathparser.ts";

export type AugmentedRequest =
  & Pick<
    ServerRequest,
    Exclude<keyof ServerRequest, "respond">
  >
  & {
    queryParams: URLSearchParams;
    routeParams: string[];
  };

export type AugmentedResponse = Response & {
  // TODO: make 2D tuple to abstract Map instantiation
  cookies?: Map<string, string>;
};

/* The function returned by
 * createRouter that performs
 * route lookups. Better name? */
export type RouteParser = (
  req: ServerRequest,
) => AugmentedResponse | Promise<AugmentedResponse>;

/* A user-defined handler for
 * a particular route. */
export type RouteHandler<TRequest = AugmentedRequest> = (
  req: TRequest,
  rootQueryParams?: URLSearchParams,
  childPathParts?: string[],
) => Response | Promise<Response>;

export type Router = (routes: RouteMap) => RouteParser;

export type RouteMap = Map<RegExp | string, RouteHandler>;
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

      // TODO: restructure this lookup to support O(1) retrieval
      for (let [path, handler] of routes) {
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
 * } from "https://deno.land/std@v0.58.0/http/server.ts";

 * import { createRouter } from "https://deno.land/x/reno@<VERSION>/reno/mod.ts";
 * import { routes } from "./routes.ts";
 *
 * const BINDING = ":8000";
 *
 * const router = createRouter(routes);
 *
 * (async () => {
 *   console.log(`Listening for requests on ${BINDING}...`);
 *
 *   await listenAndServe(
 *     BINDING,
 *     async (req: ServerRequest) => {
 *       logRequest(req);
 *
 *       try {
 *         const res = await router(req);
 *         return req.respond(res);
 *       } catch (e) {
 *         return req.respond(mapToErrorResponse(e));
 *       }
 *     },
 *   );
 * })();
 * ```
 */
export function createRouter(routes: RouteMap) {
  /* We could just do `const createRouter = routerCreator(parsePath, writeCookies)`
   * here, but sadly deno doc isn't able to surface it as a function :( */
  return routerCreator(parsePath, writeCookies)(routes);
}
