# API

* [Core](#core)
* [Request and Response Helpers](#request-and-response-helpers)
* [Testing](#testing)

## Core

### `createRouter(routes: RouteMap): (req: ServerRequest | AugmentedRequest) => Response | Promise<Response | NotFoundError | Error>`
### `createRouteMap(routes: [RegExp | string, RouteHandler][]): Map<RegExp | string, RouteHandler>`
### `pipe(...morphs: Transform[]): (handler: RouteHandler) => RouteHandler`
### `type AugmentedRequest`
### `type Response`
### `type AugmentedResponse`
### `type RouteParser`
### `type RouteHandler`
### `type Router`
### `type RouteMap`
### `type Transform`

## Request and Response Helpers

### `withJsonBody<TBody = {}>(handler: RouteHandler<JsonRequest<TBody>>): (req: AugmentedRequest) => Promise<Response | Error>`
### `withFormBody(handler: RouteHandler<FormRequest>): (req: AugmentedRequest) => Promise<Response | Error>`
### `jsonResponse<TResponseBody = {}>(body: TResponseBody, headers = {}): Response`
### `textResponse(body: string, headers = {}): Response`
### `streamResponse(body: Deno.Reader, headers = {}): Response`
### `type JsonRequest<TBody = {}>`
### `type FormRequest`

## Testing

### `assertResponsesMatch(actual: AugmentedResponse, expected: AugmentedResponse): void`
