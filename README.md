# Reno

![Reno logo](https://raw.githubusercontent.com/reno-router/reno/master/logo/reno-500.png)

[![Build Status](https://travis-ci.org/reno-router/reno.svg?branch=master)](https://travis-ci.org/reno-router/reno)

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/reno@v1.3.6/reno/mod.ts)

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://github.com/denoland/deno/tree/master/std/http).

* [Overview](#overview)
* [Key Features](#key-features)
* [Example Apps](#example-apps)
* [API Documentation](#api-documentation)
* [Local Development](#local-development)
* [Functionality Checklist](#functionality-checklist)

## Overview

```tsx
import { listenAndServe } from "https://deno.land/std@0.79.0/http/server.ts";

import {
  createRouter,
  AugmentedRequest,
  createRouteMap,
  textResponse,
  jsonResponse,
  streamResponse,
  NotFoundError,
} from "https://deno.land/x/reno@v1.3.6/reno/mod.ts";

function createErrorResponse(status: number, { message }: Error) {
  return textResponse(message, {}, status);
}

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
```

## Key Features

### Responses are just Data Structures

This, along with request handlers being [pure functions](https://en.wikipedia.org/wiki/Pure_function), makes unit testing Reno services a breeze:

```ts
import { jsonResponse, assertResponsesAreEqual } from "https://deno.land/x/reno@v1.3.6/reno/mod.ts";
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

### Route Handlers are Composable

Another consequence of route handlers being intrinsically pure functions is that they can be composed with higher-order route handlers, allowing particular behaviours to be reused across your entire application:

```ts
import { compose } from "https://deno.land/x/compose@1.3.2/index.js";

import {
  AugmentedRequest,
  RouteHandler,
  textResponse,
  createRouteMap
} from "https://deno.land/x/reno@v1.3.6/reno/mod.ts";

import isValidAPIKey from "./api_keys.ts";

function withLogging(next: RouteHandler) {
  return function (req: AugmentedRequest) {
    console.log(`${new Date().toJSON()}: ${req.method} ${req.url}`);
    return next(req);
  };
}

function withAuth(next: RouteHandler) {
  return async function (req: AugmentedRequest) {
    const apiKey = req.headers.has("Authorization")
      ? req.headers.get("Authorization")?.replace("Bearer ", "")
      : "";

    const isValid = apiKey && await isValidAPIKey(apiKey);

    return isValid
      ? next(req)
      : textResponse(`API key not authorised to access ${req.url}`, {}, 401);
  };
}

const profile = compose(
  withAuth,
  withLogging,
)(() => textResponse("Your profile!"));

export const routes = createRouteMap([
  ["/profile", profile],
]);
```

Additionally, Reno provides a `pipe` utility for creating a higher-order route handler that invokes a sequence of functions against both the original request _and_ the computed response:

```ts
import { createRouteMap, jsonResponse, pipe } from "https://deno.land/x/reno@v1.3.6/reno/mod.ts";

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

### Reno Apps are Unobtrusive, Pure Functions

Given that a Reno router is a function that takes a request and returns a response (or more specifically, `Promise<Response>`), you are free to integrate it as you wish, managing the lifecycle of your HTTP server independently. This also makes it trivial to write end-to-end tests with [SuperDeno](https://github.com/asos-craigmorten/superdeno), as evidenced by [Reno's own E2E suite](https://github.com/reno-router/reno/tree/master/e2e_tests):

```ts
import { superdeno } from "https://deno.land/x/superdeno@2.3.2/mod.ts";
import app from "../example/app.ts";

Deno.test("/ should return the expected response", async () => {
  await superdeno(app).get("/")
    .expect(200)
    .expect("Cache-Control", "max-age=86400")
    .expect("Set-Cookie", "requested_proto=HTTP/1.1")
    .expect({
      foo: "bar",
      isLol: true,
    });
});
```

## Example Apps

As well as the [example app found in this repo](https://github.com/reno-router/reno/tree/v1.3.6/example), which is targetted by the end-to-end test suite, there is a [standalone repository for a blog microservice](https://github.com/reno-router/blog-microservice) built with Deno, Reno, PostgreSQL, and Docker.

## API Documentation

Consult [Reno's entry on the Deno Doc website](https://doc.deno.land/https/deno.land/x/reno@v1.3.6/reno/mod.ts) for comprehensive documentation on Reno's API.

## Local Development

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `.deno_version`. To install the correct version, run:

```sh
# If Deno isn't currently installed...
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s v$(cat .deno_version)

# ...or it it's already present on your system
deno upgrade --version $(cat .deno_version)
```

You should also run `./tools/install_types.sh` to install the TypeScript definitions for Deno and any other third-party dependencies.

Then you can run:

* `./scripts/example.sh` - starts the example server
* `./scripts/format.sh` - formats the source code
* `./scripts/format_check.sh` - checks the formatting of the source code
* `./scripts/lint.sh` - lints the source code
* `./scripts/test.sh` - runs the unit tests
* `./scripts/e2e.sh` - runs the end-to-end tests

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

