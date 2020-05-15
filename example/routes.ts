import { createRouteMap, jsonResponse, pipe } from "../reno/mod.ts";
import { apiRouter } from "./api/routes.ts";

const withCaching = pipe(
  (req, res) => {
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

export const routes = createRouteMap([["/", home], ["/api/*", apiRouter]]);
