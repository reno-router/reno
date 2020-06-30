import { RouteHandler, AugmentedRequest, AugmentedResponse } from "./router.ts";

type Transform = (
  req: AugmentedRequest,
  res: AugmentedResponse,
) => AugmentedResponse | void;

/**
 * Takes a variadic list of transform functions and returns
 * a higher-order route handler that applies each transform
 * to the request and response returned by the inner handler:
 *
 * ```ts
 * const withCaching = pipe(
 *   (req, res) => {
 *     res.headers.append("Cache-Control", "max-age=86400");
 *   },
 *
 *   (req, res) => ({
 *     ...res,
 *     cookies: new Map<string, string>([["requested_proto", req.proto]])
 *   })
 * );
 *
 * const home = withCaching(() =>
 *   jsonResponse({
 *     foo: "bar",
 *     isLol: true
 *   })
 * );
 * ```
 */
export function pipe(...morphs: Transform[]) {
  return (
    handler: RouteHandler,
  ): RouteHandler =>
    async (req) =>
      morphs.reduce(
        (accRes, morph) => morph(req, accRes) || accRes,
        await handler(req),
      );
}
