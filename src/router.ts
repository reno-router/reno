import {
  ServerRequest,
  Response
} from 'https://deno.land/std@v0.5/http/server.ts';

export type RouteHandler = (
  req: ServerRequest,
  ...params: string[]
) => Response | Promise<Response>;
export class RouteMap extends Map<RegExp, RouteHandler> {}

const encoder = new TextEncoder();

export const json = <TResponseBody = {}>(body: TResponseBody) => ({
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  body: encoder.encode(JSON.stringify(body))
});

export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest
) => {
  for (let [path, handler] of routes) {
    const matches = req.url.match(path);
    if (matches) {
      return await handler(req, ...matches.slice(1));
    }
  }

  return {
    status: 404,
    body: encoder.encode('Not found! :(')
  };
};
