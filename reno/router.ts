import {
  ServerRequest,
  Response
} from "https://deno.land/std@v0.20.0/http/server.ts";

import { writeCookies } from "./cookies.ts";

export type AugmentedRequest = Pick<
  ServerRequest,
  Exclude<keyof ServerRequest, "respond">
> & {
  queryParams: URLSearchParams;
  routeParams: string[];
};

export type AugmentedResponse = Response & {
  cookies?: Map<string, string>;
};

/* The function returned by
 * createRouter that performs
 * route lookups. Better name? */
export type RouteParser = (
  req: ServerRequest
) => AugmentedResponse | Promise<AugmentedResponse>;

/* A user-defined handler for
 * a particular route. */
export type RouteHandler<TRequest = AugmentedRequest> = (
  req: TRequest
) => Response | Promise<Response>;

export type Router = (routes: RouteMap) => RouteParser;
export class RouteMap extends Map<RegExp, RouteHandler> {}
export class NotFoundError extends Error {} // TODO: rename RouteMissingError?

export const createAugmentedRequest = (
  { body, bodyStream, ...rest }: ServerRequest | AugmentedRequest,
  queryParams: URLSearchParams,
  routeParams: string[]
): AugmentedRequest => ({
  ...rest,
  body,
  bodyStream,
  queryParams,
  routeParams
});

export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest | AugmentedRequest
) => {
  const url = new URL(req.url, "https://");

  for (let [path, handler] of routes) {
    const matches = url.pathname.match(path);

    if (matches) {
      const res = await handler(
        createAugmentedRequest(req, url.searchParams, matches.slice(1))
      );

      // TODO: inject and test!
      writeCookies(res);

      return res;
    }
  }

  return Promise.reject(new NotFoundError(`No match for ${req.url}`));
};
