import { RouteHandler } from "./router.ts";
import { textResponse } from "./helpers.ts";

/**
 * A union of all possible HTTP
 * methods, as uppercase strings, since
 * deno/std doesn't provide one. */
export type HttpMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

/**
 * Takes mappings of HTTP methods and route handler functions, and
 * returns a higher-order route handler that will forward requests to
 * the correct handler by their method. Any requests whose method
 * does not have an associated handler will result in a HTTP 405:
 * ```ts
 * const get = () => textResponse("You performed a HTTP GET!");
 * const post = () => textResponse("You performed a HTTP POST!");
 *
 * const routes = createRouteMap([
 *   ["/endpoint", forMethod([
 *     ["GET", get],
 *     ["POST", post],
 *   ])],
 * ]);
 *
 * export const methodsRouter = createRouter(routes);
 * ```
 */
export function forMethod(
  mappings: [HttpMethod, RouteHandler][],
): RouteHandler {
  const handlers = new Map(mappings);

  return (req, ...restArgs) =>
    handlers.has(req.method as HttpMethod) // TODO: perform type assertion in AugmentedRequest creation?
      ? handlers.get(req.method as HttpMethod)!(req, ...restArgs)
      : {
        ...textResponse(`Method ${req.method} not allowed for ${req.url}`),
        status: 405,
      };
}
