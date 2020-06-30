import { RouteHandler, AugmentedRequest, AugmentedResponse } from "./router.ts";

type Transform = (
  req: AugmentedRequest,
  res: AugmentedResponse,
) => AugmentedResponse | void;

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
