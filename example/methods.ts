import {
  createRouteMap,
  createRouter,
  forMethod,
} from "../reno/mod.ts";

const get = () => new Response("You performed a HTTP GET!");
const post = () => new Response("You performed a HTTP POST!");

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
