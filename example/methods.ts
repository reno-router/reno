import {
  createRouteMap,
  createRouter,
  forMethod,
  textResponse,
} from "../reno/mod.ts";

const get = () => textResponse("You performed a HTTP GET!");
const post = () => textResponse("You performed a HTTP POST!");

const routes = createRouteMap([
  [
    "/endpoint",
    forMethod([
      ["GET", get],
      ["POST", post],
    ]),
  ],
]);

export const methodsRouter = createRouter(routes);
