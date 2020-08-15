# Reno

![Reno logo](https://raw.githubusercontent.com/reno-router/reno/master/logo/reno-500.png)

[![Build Status](https://travis-ci.org/reno-router/reno.svg?branch=master)](https://travis-ci.org/reno-router/reno)

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/reno@v1.2.3/reno/mod.ts)

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://github.com/denoland/deno/tree/master/std/http).

* [Overview](#overview)
* [Key Features](#key-features)
* [Example Apps](#example-apps)
* [API Documentation](#api-documentation)
* [Local Development](#local-development)
* [Functionality Checklist](#functionality-checklist)

## Overview

```tsx
import { listenAndServe } from "https://deno.land/std@v0.65.0/http/server.ts";

import {
  createRouter,
  AugmentedRequest,
  createRouteMap,
  textResponse,
  jsonResponse,
  streamResponse,
} from "https://deno.land/x/reno@v1.2.3/reno/mod.ts";

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

## Key Features

### Responses are just Data Structures

This, along with request handlers being [pure functions](https://en.wikipedia.org/wiki/Pure_function), makes unit testing Reno services a breeze:

```ts
import { jsonResponse, assertResponsesAreEqual } from "https://deno.land/x/reno@v1.2.3/reno/mod.ts";
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

    await assertResponsesAreEqual(
      response,
      jsonResponse(quotes, {
        "X-Foo": "bar",
      }),
    );
  }
});
```

### Wildcard Path Segments

Despite the power of regular expressions for matching and capturing paths when their route parameters conform to an expected format or type, they can often prove verbose and unwieldy for simpler applications. Reno thus provides an alternative wildcard syntax (`"*"`) for string paths to achieve route param extraction:

```ts
async function wildcardRouteParams(req: Pick<AugmentedRequest, "routeParams">) {
  const [authorId, postId] = req.routeParams;

  return textResponse(`You requested ${postId} by ${authorId}`);
}

const routes = createRouteMap([
  ["/wildcard-route-params/authors/*/posts/*", wildcardRouteParams],
]);

const router = createRouter(routes);
```

### Nested Routers

Like most other HTTP routing libraries that you know and love, Reno supports nested routers; you can use wildcards as suffixes to group routers by a common path segment:

```ts
const routes = createRouteMap([
  [
    "/foo/*",
    createRouter(
      createRouteMap([
        [
          "/bar/*",
          createRouter(createRouteMap([["/baz", () =>
            textResponse("Hello from a nested route!")]])),
        ],
      ]),
    ),
  ],
]);

const router = createRouter(routes);
```

### `pipe()` - An Alternative to Middleware

Reno emulates the middleware pattern, [found in Express](https://expressjs.com/en/guide/using-middleware.html), by favouring [function piping](https://www.sitepoint.com/function-composition-in-javascript/#theimportanceofinvocationorder) to create reusable, higher-order route handlers:

```ts
import { createRouteMap, jsonResponse, pipe } from "https://deno.land/x/reno@v1.2.3/reno/mod.ts";

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

## Example Apps

As well as the [example app found in this repo](https://github.com/reno-router/reno/tree/v1.2.3/example), which is targetted by the [end-to-end test suite](https://github.com/reno-router/reno#end-to-end-tests), there is a [standalone repository for a blog microservice](https://github.com/reno-router/blog-microservice) built with Deno, Reno, PostgreSQL, and Docker.

## API Documentation

Consult [Reno's entry on the Deno Doc website](https://doc.deno.land/https/deno.land/x/reno@v1.2.3/reno/mod.ts) for comprehensive documentation on Reno's API.

## Local Development

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `.deno-version`. To install the correct version, run:

```sh
# If Deno isn't currently installed...
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s v$(cat .deno-version)

# ...or it it's already present on your system
deno upgrade --version $(cat .deno-version)
```

You should also run `./tools/install-types.sh` to install the TypeScript definitions for Deno and any other third-party dependencies.

Then you can run:

* `./scripts/example.sh` - starts the example server
* `./scripts/format.sh` - formats the source code
* `./scripts/format-check.sh` - checks the formatting of the source code
* `./scripts/lint.sh` - lints the source code
* `./scripts/test.sh` - runs the unit tests

### End-to-End Tests

There's an [end-to-end test suite](https://github.com/reno-router/reno/tree/master/e2e-tests) written in Node.js, TypeScript, and [Frisby](https://github.com/vlucas/frisby). You can run this by consulting the directory's [README](https://github.com/reno-router/reno/blob/master/e2e-tests/README.md).

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

