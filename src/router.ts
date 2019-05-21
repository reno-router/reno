import {
  ServerRequest,
  Response,
} from 'https://deno.land/std@v0.5/http/server.ts';

export type ProtectedRequest = Pick<
  ServerRequest,
  'url' | 'method' | 'headers' | 'body' | 'bodyStream'
> & {
  queryParams: URLSearchParams;
  routeParams: string[];
};

export type RouteHandler = (
  req: ProtectedRequest,
) => Response | Promise<Response>;
export class RouteMap extends Map<RegExp, RouteHandler> {}

const encoder = new TextEncoder();

const createProtectedRequest = (
  { url, method, headers, body, bodyStream }: ServerRequest,
  queryParams: URLSearchParams,
  routeParams: string[],
) => ({
  url,
  method,
  headers,
  body,
  bodyStream,
  queryParams,
  routeParams,
});

export const json = <TResponseBody = {}>(body: TResponseBody) => ({
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)), // TODO: stream over response writer?
});

// TODO: tests!
export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest,
) => {
  for (let [path, handler] of routes) {
    const url = new URL(req.url, 'https://');
    const matches = url.pathname.match(path);

    if (matches) {
      return await handler(
        createProtectedRequest(req, url.searchParams, matches.slice(1)),
      );
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
