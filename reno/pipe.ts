import { RouteHandler, AugmentedRequest, AugmentedResponse } from "./router.ts";

type Homomorph = (
  req: AugmentedRequest,
  res: AugmentedResponse
) => AugmentedResponse;

const pipe = (...morphs: Homomorph[]) => (
  handler: RouteHandler
): RouteHandler => async req =>
  morphs.reduce((accRes, morph) => morph(req, accRes), await handler(req));

export default pipe;
