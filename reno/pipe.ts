import { RouteHandler, AugmentedRequest, AugmentedResponse } from "./router.ts";

type Transform = (
  req: AugmentedRequest,
  res: AugmentedResponse
) => AugmentedResponse;

export const pipe = (...morphs: Transform[]) => (
  handler: RouteHandler
): RouteHandler => async req =>
  morphs.reduce((accRes, morph) => morph(req, accRes), await handler(req));
