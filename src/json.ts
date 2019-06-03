import { AugmentedRequest, RouteHandler } from './router.ts';

// TODO: share reference?
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type JsonRequest<TBody> = Pick<
  AugmentedRequest,
  Exclude<keyof AugmentedRequest, 'body'>
> & {
  body: TBody;
};

// TODO: find a better way?!
const createJsonRequest = <TBody>(
  { bodyStream, respond, ...rest }: AugmentedRequest,
  body: TBody,
) => ({
  ...rest,
  body,
  bodyStream,
  respond, // TODO: omit!!!
});

export const withJsonBody = <TBody>(
  handler: RouteHandler<JsonRequest<TBody | unknown>>,
) => async (req: AugmentedRequest) => {
  const rawBody = await req.body();

  if (!rawBody.byteLength) {
    return handler(
      createJsonRequest(
        req,
        {} as TBody, // TODO: runtime safety!
      ),
    );
  }

  const bodyText = decoder.decode(rawBody);
  const body = JSON.parse(bodyText) as TBody;

  return handler(createJsonRequest(req, body));
};

export const jsonResponse = <TResponseBody = {}>(
  body: TResponseBody,
  headers: domTypes.HeadersInit = {},
) => ({
  headers: new Headers({
    ...headers,
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)),
});
