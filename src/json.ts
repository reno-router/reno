// TODO: share reference?
const encoder = new TextEncoder();

export const jsonResponse = <TResponseBody = {}>(body: TResponseBody, headers: domTypes.HeadersInit = {}) => ({
  headers: new Headers({
    ...headers,
    'Content-Type': 'application/json',
  }),
  body: encoder.encode(JSON.stringify(body)),
});
