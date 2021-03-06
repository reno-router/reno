// TODO: find a better name than "helpers"

import { AugmentedRequest, RouteHandler } from "./router.ts";
import { BufReader } from "../deps.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * An AugmentedRequest whose body property has
 * been overriden to be of a different type.
 * Reno uses this internally to create typed
 * bodies for its provided higher-order route
 * handlers, but can potentially be useful when
 * defining your own higher-order functions.
 */
export type ProcessedRequest<TBody> =
  & Pick<
    AugmentedRequest,
    Exclude<keyof AugmentedRequest, "body">
  >
  & {
    body: TBody;
  };

/**
 * A ProcessedRequest that allows the body
 * type to be configured via the sole type
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

function createProcessedRequest<TBody>(req: AugmentedRequest, body: TBody) {
  return {
    ...req,
    body,
  };
}

function parseFormBody(body: string) {
  return new URLSearchParams(body);
}

async function getReqBodyAsString(req: AugmentedRequest) {
  if (!req.contentLength) {
    throw new Error("Content-Length header was not set!");
  }

  const bufReader = BufReader.create(req.body);
  const bytes = new Uint8Array(req.contentLength);

  await bufReader.readFull(bytes);

  return decoder.decode(bytes);
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
 * const getNameLength = withJsonBody<PersonRequestBody>(({ body }) =>
 *   jsonResponse<NameLengthResponseBody>({
 *     length: body.name.length,
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
    const bodyText = (await getReqBodyAsString(req)).trim();

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
  return {
    status,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
    body: encoder.encode(JSON.stringify(body)),
  };
}

/**
 * A response creator function for building text responses, that:
 * defaults the Content-Type header to "text/plain";
 * and encodes the body as a Uint8Array
 */
export function textResponse(body: string, headers = {}, status = 200) {
  return {
    status,
    headers: new Headers({
      "Content-Type": "text/plain",
      ...headers,
    }),
    body: encoder.encode(body),
  };
}

/**
 * A response creator function for building stream responses. This
 * one currently doesn't do anything special, but it at least saves
 * the effort of having to create response objects manually, and
 * in the future may contain some sort of enhancing behaviour
 */
export function streamResponse(body: Deno.Reader, headers = {}) {
  return {
    headers: new Headers(headers),
    body,
  };
}

/**
 * A higher-order function that takes a route handler function and
 * returns another route handler that parses form data bodies before
 * invoking the inner handler. The data is parsed internally by
 * creating a `URLSearchParams` instance, which is then passed to
 * the inner handler via the `body` prop of the first argument:
 *
 * ```ts
 * const getNameLength = withFormBody(({ body }) =>
 *   textResponse(`?name is ${(body.get('name') || '0').length} bytes`)
 * );
 * ```
 */
export function withFormBody(handler: RouteHandler<FormRequest>) {
  return async (
    req: AugmentedRequest,
  ) => {
    const bodyText = await getReqBodyAsString(req);
    const body = parseFormBody(bodyText);

    return handler(createProcessedRequest(req, body));
  };
}
