import { compose } from "https://deno.land/x/compose@1.3.2/index.js";

import {
  AugmentedRequest,
  createRouteMap,
  jsonResponse,
  pipe,
  RouteHandler,
  textResponse,
} from "../reno/mod.ts";

import { apiRouter } from "./api/routes.ts";
import { methodsRouter } from "./methods.ts";
import isValidAPIKey from "./api_keys.ts";

function withLogging(next: RouteHandler) {
  return function (req: AugmentedRequest) {
    console.log(`${new Date().toJSON()}: ${req.method} ${req.url}`);
    return next(req);
  };
}

function withAuth(next: RouteHandler) {
  return async function (req: AugmentedRequest) {
    const apiKey = req.headers.has("Authorization")
      ? req.headers.get("Authorization")?.replace("Bearer ", "")
      : "";

    const isValid = apiKey && await isValidAPIKey(apiKey);

    return isValid
      ? next(req)
      : textResponse(`API key not authorised to access ${req.url}`, {}, 401);
  };
}

const withCaching = pipe(
  (_, res) => {
    res.headers = res.headers || new Headers();
    res.headers.append("Cache-Control", "max-age=86400");
    return res;
  },
  (req, res) => ({
    ...res,
    cookies: new Map<string, string>([["requested_proto", req.proto]]),
  }),
);

const home = withCaching(() =>
  jsonResponse({
    foo: "bar",
    isLol: true,
  })
);

const profile = compose(
  withAuth,
  withLogging,
)(() => textResponse("Your profile!"));

export const routes = createRouteMap([
  ["/", home],
  ["/profile", profile],
  ["/api/*", apiRouter],
  ["/methods/*", methodsRouter],
]);
