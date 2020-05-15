// TODO: find a better name than "helpers"

import { AugmentedRequest, RouteHandler, AugmentedResponse } from "./router.ts";
import { BufReader } from "../deps.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type ProcessedRequest<TBody> =
  & Pick<
    AugmentedRequest,
    Exclude<keyof AugmentedRequest, "body">
  >
  & {
    body: TBody;
  };

export type JsonRequest<TBody = {}> = ProcessedRequest<TBody>;
export type FormRequest = ProcessedRequest<URLSearchParams>;

// TODO: find a better way?!
const createProcessedRequest = <TBody>(
  req: AugmentedRequest,
  body: TBody,
) => ({
  ...req,
  body,
});

/* Maybe we'll need to write a
 * dedicated impl at some point */
const parseFormBody = (body: string) => new URLSearchParams(body);

const getReqBodyAsString = async (req: AugmentedRequest) => {
  if (!req.contentLength) {
    throw new Error("Content-Length header was not set!");
  }

  const bufReader = BufReader.create(req.body);
  const bytes = new Uint8Array(req.contentLength);

  await bufReader.readFull(bytes);

  return decoder.decode(bytes);
};

export const withJsonBody = <TBody = {}>(
  handler: RouteHandler<JsonRequest<TBody>>,
) =>
  async (req: AugmentedRequest) => {
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

    return await handler(createProcessedRequest(req, body));
  };

export const jsonResponse = <TResponseBody = {}>(
  body: TResponseBody,
  headers = {},
) => ({
  headers: new Headers({
    "Content-Type": "application/json",
    ...headers,
  }),
  body: encoder.encode(JSON.stringify(body)),
});

export const textResponse = (
  body: string,
  headers = {},
) => ({
  headers: new Headers({
    "Content-Type": "text/plain",
    ...headers,
  }),
  body: encoder.encode(body),
});

export const streamResponse = (
  body: Deno.Reader,
  headers = {},
) => ({
  headers: new Headers(headers),
  body,
});

export const withFormBody = (handler: RouteHandler<FormRequest>) =>
  async (
    req: AugmentedRequest,
  ) => {
    const bodyText = await getReqBodyAsString(req);
    const body = parseFormBody(bodyText);

    return await handler(createProcessedRequest(req, body));
  };
