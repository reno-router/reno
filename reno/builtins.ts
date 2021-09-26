// TODO: find a better name than "helpers"

import { AugmentedRequest, AugmentedResponse, RouteHandler } from "./router.ts";
import { readableStreamFromReader } from "../deps.ts";

/**
 * An AugmentedRequest with an additional property
 * containing the body after it has been parsed or
 * processed, typically by one of the built-in
 * middlewares. For example, the `withJsonBody()`
 * middleware will deserialise the raw body with
 * `JSON.parse()` and assign the result to the
 * `parsedBody` property before forwarding the
 * `ProcessedRequest` to the wrapped route handler.
 *
 * This type can also be useful when defining
 * your own higher-order route handlers.
 */
export type ProcessedRequest<TBody> = AugmentedRequest & {
  /**
   * The parsed or processed request body.
   */
  parsedBody: TBody;
};

/**
 * A ProcessedRequest that allows the body
 * type to be specified via the sole type
 * parameter. Defaults to an empty object.
 */
export type JsonRequest<TBody = Record<string, unknown>> = ProcessedRequest<
  TBody
>;

/**
 * A ProcessedRequest with a body type
 * reflecting a URLSearchParams instance.
 */
export type FormRequest = ProcessedRequest<URLSearchParams>;

function createProcessedRequest<TBody>(
  req: AugmentedRequest,
  parsedBody: TBody,
) {
  /* We use Object.assign() instead of spreading
   * the original request into a new object, as the
   * methods of the Request type are not enumerable. */
  return Object.assign(req, {
    parsedBody,
  });
}

function parseFormBody(body: string) {
  return new URLSearchParams(body);
}

/**
 * A higher-order function that takes a route handler function and
 * returns another route handler that parses JSON bodies before
 * invoking the inner handler:
 *
 * ```ts
 * interface PersonRequestBody {
 *   name: string;
 * }
 *
 * interface NameLengthResponseBody {
 *   length: number;
 * }
 *
 * const getNameLength = withJsonBody<PersonRequestBody>(({ parsedBody }) =>
 *   jsonResponse<NameLengthResponseBody>({
 *     length: parsedBody.name.length,
 *   })
 * );
 * ```
 */
export function withJsonBody<TBody>(handler: RouteHandler<JsonRequest<TBody>>) {
  return async (req: AugmentedRequest) => {
    /* There are some instances in which an
     * empty body can have whitespace, so
     * we decode early and trim the resultant
     * string to determine the body's presence */
    const bodyText = (await req.text()).trim();

    if (!bodyText.length) {
      return handler(
        createProcessedRequest(
          req,
          {} as TBody, // TODO: runtime safety! Use Map?!
        ),
      );
    }

    const body = JSON.parse(bodyText) as TBody;

    return handler(createProcessedRequest(req, body));
  };
}

/**
 * A response creator function for building JSON responses, that:
 * defaults the Content-Type header to "application/json"; and
 * serialises the JSON body to a string that's then encoded as a Uint8Array
 */
export function jsonResponse<TResponseBody>(
  body: TResponseBody,
  headers = {},
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: new Headers({
      ...headers,
      "Content-Type": "application/json",
    }),
  });
}

/**
 * A response creator function for building stream responses. This
 * one currently doesn't do anything special, but it at least saves
 * the effort of having to create response objects manually, and
 * in the future may contain some sort of enhancing behaviour
 */
export function streamResponse(body: Deno.Reader, headers = {}) {
  return new Response(readableStreamFromReader(body), {
    headers: new Headers(headers),
  });
}

/**
 * A higher-order function that takes a route handler function and
 * returns another route handler that parses form data bodies before
 * invoking the inner handler. The data is parsed internally by
 * creating a `URLSearchParams` instance, which is then passed to
 * the inner handler via the `body` prop of the first argument:
 *
 * ```ts
 * const getNameLength = withFormBody(({ parsedBody }) =>
 *   new Response(`?name is ${(parsedBody.get('name') || '0').length} bytes`)
 * );
 * ```
 */
export function withFormBody(handler: RouteHandler<FormRequest>) {
  return async (
    req: AugmentedRequest,
  ) => {
    const bodyText = await req.text();
    const body = parseFormBody(bodyText);

    return handler(createProcessedRequest(req, body));
  };
}

/**
 * Assigns the provided cookies to the underlying Response instance, which
 * are then sent to the requestor via multiple `Set-Cookie` headers:
 *
 * ```ts
 * const handler: RouteHandler = async req => withCookies(
 *   new Response("Hi!"),
 *   [
 *     ["session_id", await getSessionId(req)],
 *   ],
 * );
 * ```
 */
export function withCookies(
  res: Response,
  cookies: [string, string][],
): AugmentedResponse {
  return Object.assign(res, {
    cookies,
  });
}
