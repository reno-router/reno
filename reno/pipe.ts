import { RouteHandler, AugmentedRequest, AugmentedResponse } from "./router.ts";

type Transform = (
  req: AugmentedRequest,
  res: AugmentedResponse,
) => AugmentedResponse | void;

export const pipe = (...morphs: Transform[]) =>
  (
    handler: RouteHandler,
  ): RouteHandler =>
    async (req) =>
      morphs.reduce(
        (accRes, morph) => morph(req, accRes) || accRes,
        await handler(req),
      );
