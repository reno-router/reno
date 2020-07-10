import { RouteHandler } from "./router.ts";
import { textResponse } from "./helpers.ts";

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

export function forMethod(mappings: [HttpMethod, RouteHandler][]): RouteHandler {
  const handlers = new Map(mappings);

  return (req, ...restArgs) =>
    handlers.has(req.method as HttpMethod) // perform type assertion in AugmentedRequest creation?
      ? handlers.get(req.method as HttpMethod)!(req, ...restArgs)
      : {
          ...textResponse(`Method ${req.method} not allowed for ${req.url}`),
          status: 405,
      };
}
