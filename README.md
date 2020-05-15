# Reno

![Reno logo](https://raw.githubusercontent.com/reno-router/reno/master/logo/reno-500.png)

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://github.com/denoland/deno_std/tree/master/http).

```tsx
import { listenAndServe } from "https://deno.land/std@v0.51.0/http/server.ts";

import {
  createRouter,
  AugmentedRequest,
  createRouteMap,
  textResponse,
  jsonResponse,
  streamResponse,
} from "https://deno.land/x/reno@v1.0.0-alpha.1/reno/mod.ts";

export const routes = createRouteMap([
  ["/home", () => textResponse("Hello world!")],

  // Supports RegExp routes for further granularity
  [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
    const [quotesCount = "1"] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    return jsonResponse(await res.json());
  }],

  // Supports Reader for streaming responses in chunks
  ["/streamed-response", () => streamResponse(
    new ReactReader(<App />),
  )],
]);

const notFound = (e: NotFoundError) => createErrorResponse(404, e);
const serverError = (e: Error) => createErrorResponse(500, e);

const mapToErrorResponse = (e: Error) =>
  e instanceof NotFoundError ? notFound(e) : serverError(e);

const router = createRouter(routes);

(async () => {
  console.log("Listening for requests...");

  await listenAndServe(
    ":8001",
    async (req: ServerRequest) => {
      try {
        const res = await router(req);
        return req.respond(res);
      } catch (e) {
        return req.respond(mapToErrorResponse(e));
      }
    },
  );
})();
```

**TODO: replace/complement this with proper documentation**

## Responses are just Data Structures

This, along with request handlers being [pure functions](https://en.wikipedia.org/wiki/Pure_function), makes unit testing Reno services a breeze:

```ts
import { jsonResponse, assertResponsesMatch } from "https://deno.land/x/reno@v1.0.0-alpha.1/reno/mod.ts";
import { createRonSwansonQuoteHandler } from "./routes.ts";

const createFetchStub = (response: string[]) =>
  sinon.stub().resolves({
    json: sinon.stub().resolves(response),
  });

test({
  name: "ronSwansonQuoteHandler should fetch a quote from an API and return it",
  async fn() {
    const quotes = ["Some Ron Swanson Quote"];
    const fetchStub = createFetchStub(quotes);
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(fetchStub);

    const req = {
      routeParams: []
    };

    const response = await ronSwansonQuoteHandler(req);

    assertResponsesMatch(response, jsonResponse(quotes, {
      "X-Foo": "bar"
    }));
  }
});
```

## `pipe()` - An Alternative to Middleware

Reno emulates the middleware pattern, [found in Express](https://expressjs.com/en/guide/using-middleware.html), by favouring [function piping](https://www.sitepoint.com/function-composition-in-javascript/#theimportanceofinvocationorder) to create reusable, higher-order route handlers:

```ts
import { createRouteMap, jsonResponse, pipe } from "https://deno.land/x/reno@v1.0.0-alpha.1/reno/mod.ts";

const withCaching = pipe(
  (req, res) => {
    /* Mutate the response returned by
     * the inner route handler... */
    res.headers.append("Cache-Control", "max-age=86400");
  },

  /* ...or go FP and return a new
   * response reference entirely. */
  (req, res) => ({
    ...res,
    cookies: new Map<string, string>([["requested_proto", req.proto]])
  })
);

const home = withCaching(() =>
  jsonResponse({
    foo: "bar",
    isLol: true
  })
);

export const routes = createRouteMap([["/", home]]);
```

## Local Development

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `.deno-version`. To install the correct version, run:

```sh
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s $(cat .deno-version)
```

You should also run `./tools/install-types.sh` to install the TypeScript definitions for Deno and any other third-party dependencies.

Then you can run:

* `deno run --allow-net example/index.ts` - starts the example server
* `deno test` - runs the unit tests

## Functionality Checklist

* [x] Path routing
* [x] Async-compatible route handlers
* [x] Error handling
* [x] Route params
* [x] Query params
* [x] Response helpers
* [x] JSON
* [x] Custom headers
* [x] Request bodies
* [x] Cookies
* [x] Streaming responses with [`Reader`](https://deno.land/typedoc/interfaces/_deno_.reader.html)
* [ ] Streaming request bodies

