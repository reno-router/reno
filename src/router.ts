import {
  ServerRequest,
  Response,
} from 'https://deno.land/std@v0.7/http/server.ts';
import { StringReader } from 'https://deno.land/std@v0.7/io/readers.ts';

export type ProtectedRequest = Pick<
  ServerRequest,
  'url' | 'method' | 'headers' | 'body' | 'bodyStream' | 'w'
> & {
  queryParams: URLSearchParams;
  routeParams: string[];
};

/* The function returned by
 * createRouter that performs
 * route lookups. Better name? */
export type RouteParser = (req: ServerRequest) => Response | Promise<Response>;

/* A user-defined handler for
 * a particular route. */
export type RouteHandler = (
  req: ProtectedRequest,
) => Response | Promise<Response | void>;

export type Router = (routes: RouteMap) => RouteParser;
export class RouteMap extends Map<RegExp, RouteHandler> {}

export class NotFoundError extends Error {}

const encoder = new TextEncoder();

const createProtectedRequest = (
  { url, method, headers, body, bodyStream, w }: ServerRequest,
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
  isProtected: true,
  w,
});

export const json = <TResponseBody = {}>(body: TResponseBody, headers: domTypes.HeadersInit = {}) => ({
  headers: new Headers({
    ...headers,
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)),
});

export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest | ProtectedRequest,
) => {
  const url = new URL(req.url, 'https://');

  for (let [path, handler] of routes) {
    const matches = url.pathname.match(path);

    if (matches) {
      return await handler(
        req instanceof ServerRequest
          ? createProtectedRequest(req, url.searchParams, matches.slice(1))
          : req // requests forwarded to sub-routers are already protected!
      );
    }
  }

  return Promise.reject(new NotFoundError(`No match for ${req.url}`));
};
