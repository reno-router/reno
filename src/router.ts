import {
  ServerRequest,
  Response,
} from 'https://deno.land/std@v0.7/http/server.ts';

export type AugmentedRequest = ServerRequest
  & Pick<ServerRequest, Exclude<keyof ServerRequest, 'respond'>>
  & {
    queryParams: URLSearchParams;
    routeParams: string[];
  };

/* The function returned by
 * createRouter that performs
 * route lookups. Better name? */
export type RouteParser = (req: ServerRequest) => Response | Promise<Response>;

/* A user-defined handler for
 * a particular route. */
export type RouteHandler<TRequest = AugmentedRequest> = (
  req: TRequest,
) => Response | Promise<void | Response>;

export type Router = (routes: RouteMap) => RouteParser;
export class RouteMap extends Map<RegExp, RouteHandler> {}
export class NotFoundError extends Error {}

export const createAugmentedRequest = (
  { body, bodyStream, ...rest }: ServerRequest,
  queryParams: URLSearchParams,
  routeParams: string[],
): AugmentedRequest => ({
  ...rest,
  body,
  bodyStream,
  queryParams,
  routeParams,
  respond: undefined,
});

export const createRouter = (routes: RouteMap) => async (
  req: ServerRequest | AugmentedRequest,
) => {
  const url = new URL(req.url, 'https://');

  for (let [path, handler] of routes) {
    const matches = url.pathname.match(path);

    if (matches) {
      return await handler(
        createAugmentedRequest(req, url.searchParams, matches.slice(1)),
      );
    }
  }

  return Promise.reject(new NotFoundError(`No match for ${req.url}`));
};
