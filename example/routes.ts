import { compose } from "https://deno.land/x/compose@1.3.2/index.js";

import {
  AugmentedRequest,
  createRouteMap,
  jsonResponse,
  RouteHandler,
  withCookies,
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
      : new Response(`API key not authorised to access ${req.pathname}`, {
        status: 401,
      });
  };
}

const withCaching = (handler: RouteHandler) =>
  async (req: AugmentedRequest) => {
    const res = await handler(req);
    res.headers.append("Cache-Control", "max-age=86400");
    return res;
  };

const withProtoCookie = (handler: RouteHandler) =>
  async (req: AugmentedRequest) =>
    withCookies(await handler(req), [
      ["requested_method", req.method],
    ]);

const home = compose(
  withCaching,
  withProtoCookie,
)(() =>
  jsonResponse({
    foo: "bar",
    isLol: true,
  })
);

const profile = compose(
  withAuth,
  withLogging,
)(() => new Response("Your profile!"));

export const routes = createRouteMap([
  ["/", home],
  ["/profile", profile],
  ["/api/*", apiRouter],
  ["/methods/*", methodsRouter],
]);
