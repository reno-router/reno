import {
  ServerRequest,
  Response,
} from 'https://deno.land/std@v0.5/http/server.ts';

export type RouteHandler = (
  queryParams: URLSearchParams,
  ...params: string[]
) => Response | Promise<Response>;

export class RouteMap extends Map<RegExp, RouteHandler> {}

const encoder = new TextEncoder();

export const json = <TResponseBody = {}>(body: TResponseBody) => ({
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)),
});

export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest,
) => {
  for (let [path, handler] of routes) {
    const url = new URL(req.url, 'https://');
    const matches = url.pathname.match(path);

    if (matches) {
      return await handler(url.searchParams, ...matches.slice(1));
    }
  }

  return {
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
    status: 404,
    body: encoder.encode('Not found! :('),
  };
};
