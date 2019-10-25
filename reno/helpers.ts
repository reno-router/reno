import { AugmentedRequest, RouteHandler, AugmentedResponse } from "./router.ts";

// TODO: share reference?
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type ProcessedRequest<TBody> = Pick<
  AugmentedRequest,
  Exclude<keyof AugmentedRequest, "body">
> & {
  body: TBody;
};

export type JsonRequest<TBody = {}> = ProcessedRequest<TBody>;
export type FormRequest = ProcessedRequest<URLSearchParams>;

export interface StreamResponse {
  headers: Headers;
  targetWriter: Deno.WriteCloser;
  sourceReader: Deno.Reader;
}

// TODO: find a better way?!
const createProcessedRequest = <TBody>(
  { bodyStream, ...rest }: AugmentedRequest,
  body: TBody
) => ({
  ...rest,
  body,
  bodyStream
});

/* Maybe we'll need to write a
 * dedicated impl at some point */
const parseFormBody = (body: string) => new URLSearchParams(body);

export const withJsonBody = <TBody>(
  handler: RouteHandler<JsonRequest<TBody | unknown>>
) => async (req: AugmentedRequest) => {
  /* There are some instances in which an
   * empty body can have whitespace, so
   * we decode early and trim the resultant
   * string to determine the body's presence */
  const rawBody = await req.body();
  const bodyText = decoder.decode(rawBody).trim();

  if (!bodyText.length) {
    return handler(
      createProcessedRequest(
        req,
        {} as TBody // TODO: runtime safety! Use Map?!
      )
    );
  }

  const body = JSON.parse(bodyText) as TBody;

  return await handler(createProcessedRequest(req, body));
};

export const jsonResponse = <TResponseBody = {}>(
  body: TResponseBody,
  headers: domTypes.HeadersInit = {}
) => ({
  headers: new Headers({
    ...headers,
    "Content-Type": "application/json"
  }),
  body: encoder.encode(JSON.stringify(body))
});

export const textResponse = (
  body: string,
  headers: domTypes.HeadersInit = {}
) => ({
  headers: new Headers({
    ...headers,
    "Content-Type": "text/plain"
  }),
  body: encoder.encode(body)
});

export const streamResponse = (
  targetWriter: Deno.WriteCloser,
  sourceReader: Deno.Reader,
  headers: domTypes.HeadersInit = {}
): StreamResponse => ({
  headers: new Headers(headers),
  targetWriter,
  sourceReader,
});

export const isStreamResponse = (response: unknown): response is StreamResponse =>
  ['targetWriter', 'sourceReader'].every(key => key in (response as StreamResponse));

export const withFormBody = (handler: RouteHandler<FormRequest>) => async (
  req: AugmentedRequest
) => {
  const rawBody = await req.body();
  const bodyText = decoder.decode(rawBody);
  const body = parseFormBody(bodyText);

  return await handler(createProcessedRequest(req, body));
};
