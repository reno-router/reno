import { ServerRequest, Response } from 'https://deno.land/std@v0.5/http/server.ts';

const encoder = new TextEncoder();

type RouteHandler = (req: ServerRequest) => Response;

const home = () => ({
  body: encoder.encode('Hello world!'), // TODO: streamable
});

const routes = new Map<string, RouteHandler>([
  ['/', home],
]);

const createRouter = (routes: Map<string, RouteHandler>) =>
  (req: ServerRequest) => {
    if (!routes.has(req.url)) { // TODO: regex routes
      return {
        status: 404,
        body: encoder.encode('Not found! :('),
      }
    }

    return routes.get(req.url)(req);
  };

const router = createRouter(routes);

const app = (req: ServerRequest) => {
  req.respond(router(req));
};

export default app;
