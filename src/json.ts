import { ProtectedRequest, RouteHandler } from './router.ts';

// TODO: share reference?
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type JsonRequest<TBody> = Pick<ProtectedRequest, Exclude<keyof ProtectedRequest, 'body'>> & {
  body: TBody,
};

export const withJsonBody = <TBody>(handler: RouteHandler<JsonRequest<TBody>>) =>
  async (req: ProtectedRequest) => {
    const rawBody = decoder.decode(await req.body());

    // TODO: error handling, validation?
    const body = JSON.parse(rawBody) as TBody;

    const augmentedRequest = {
      ...req,
      body,
    };

    return handler(augmentedRequest);
  };

export const jsonResponse = <TResponseBody = {}>(body: TResponseBody, headers: domTypes.HeadersInit = {}) => ({
  headers: new Headers({
    ...headers,
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)),
});
