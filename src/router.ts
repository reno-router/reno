import { ServerRequest, Response } from 'https://deno.land/std@v0.5/http/server.ts';

export type RouteHandler = (req: ServerRequest) => Response | Promise<Response>;
export class RouteMap extends Map<RegExp, RouteHandler> {}

const encoder = new TextEncoder();

export const json = <TResponseBody = {}>(body: TResponseBody) => ({
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(
    JSON.stringify(body),
  ),
});

export const createRouter = (routes: RouteMap) =>
  async (req: ServerRequest) => {
    for (let [path, handler] of routes) {
      if (req.url.match(path)) {
        return await handler(req);
      }
    }

    return {
      status: 404,
      body: encoder.encode('Not found! :('),
    }
  };