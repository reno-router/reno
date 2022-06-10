# Reno

![Reno logo](https://raw.githubusercontent.com/reno-router/reno/master/logo/reno-500.png)

[![Build status](https://github.com/reno-router/reno/workflows/CI/badge.svg)](https://github.com/reno-router/reno/actions) [![Deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/reno@v{{version}}/reno/mod.ts) [![Published on Nest.land](https://nest.land/badge.svg)](https://nest.land/package/reno)

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://deno.land/std/http).

* [Overview](#overview)
* [Key Features](#key-features)
* [Example Apps](#example-apps)
* [API Documentation](#api-documentation)
* [Local Development](#local-development)
* [Functionality Checklist](#functionality-checklist)

---

## Overview

```tsx
import { serve } from "https://deno.land/std@0.143.0/http/server.ts";

import {
  AugmentedRequest,
  createRouteMap,
  createRouter,
  jsonResponse,
  MissingRouteError,
  streamResponse,
} from "https://deno.land/x/reno@v{{version}}/reno/mod.ts";

/* Alternatively, you can import Reno from nest.land:
 * import { ... } from "https://x.nest.land/reno@2.0.18/reno/mod.ts";
 */

const PORT = 8000;

function createErrorResponse(status: number, { message }: Error) {
  return new Response(message, {
    status,
  });
}

export const routes = createRouteMap([
  ["/", () => new Response("Hello world!")],

  // Supports RegExp routes for further granularity
  [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
    const [quotesCount = "1"] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    return jsonResponse(await res.json());
  }],

  // Supports Reader for streaming responses in chunks
  ["/streamed-response", () =>
    streamResponse(
      new ReactReader(<App />),
    )],
]);

const notFound = (e: MissingRouteError) => createErrorResponse(404, e);
const serverError = (e: Error) => createErrorResponse(500, e);

const mapToErrorResponse = (e: Error) =>
  e instanceof MissingRouteError ? notFound(e) : serverError(e);

const router = createRouter(routes);

console.log(`Listening for requests on port ${PORT}...`);

await serve(
  async (req) => {
    try {
      return await router(req);
    } catch (e) {
      return mapToErrorResponse(e);
    }
  },
  {
    port: PORT,
  },
);
```

## Key Features

### Responses are just Data Structures

This, along with request handlers being [pure functions](https://en.wikipedia.org/wiki/Pure_function), makes unit testing Reno services a breeze:

```ts
import { jsonResponse, assertResponsesAreEqual } from "https://deno.land/x/reno@v{{version}}/reno/mod.ts";
import { createRonSwansonQuoteHandler } from "./routes.ts";

const createFetchStub = (response: string[]) =>
  sinon.stub().resolves({
    json: sinon.stub().resolves(response),
  });

Deno.test({
  name: "ronSwansonQuoteHandler should fetch a quote from an API and return it",
  async fn() {
    const quotes = ["Some Ron Swanson Quote"];
    const fetchStub = createFetchStub(quotes);
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(fetchStub);

    const req = {
      routeParams: [],
    };

    const response = await ronSwansonQuoteHandler(req);

    await assertResponsesAreEqual(
      response,
      jsonResponse(quotes, {
        "X-Foo": "bar",
      }),
    );
  },
});
```

### Wildcard Path Segments

Despite the power of regular expressions for matching and capturing paths when their route parameters conform to an expected format or type, they can often prove verbose and unwieldy for simpler applications. Reno thus provides an alternative wildcard syntax (`"*"`) for string paths to achieve route param extraction:

```ts
function wildcardRouteParams(req: Pick<AugmentedRequest, "routeParams">) {
  const [authorId, postId] = req.routeParams;

  return new Response(`You requested ${postId} by ${authorId}`);
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
            new Response("Hello from a nested route!")]])),
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
  createRouteMap
} from "https://deno.land/x/reno@v{{version}}/reno/mod.ts";

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
      : new Response(`API key not authorised to access ${req.pathname}`, {
        status: 401,
      });
  };
}

const profile = compose(
  withAuth,
  withLogging,
)(() => new Response("Your profile!"));

export const routes = createRouteMap([
  ["/profile", profile],
]);
```

### Reno Apps are Unobtrusive, Pure Functions

Given that a Reno router is a function that takes a request and returns a response (or more specifically, `Promise<Response>`), you are free to integrate it as you wish, managing the lifecycle of your HTTP server independently. This also makes it trivial to write end-to-end tests with [SuperDeno](https://github.com/asos-craigmorten/superdeno), as evidenced by [Reno's own E2E suite](https://github.com/reno-router/reno/tree/master/e2e_tests):

```ts
import { superdeno } from "https://deno.land/x/superdeno@4.5.0/mod.ts";
import app from "../example/app.ts";

Deno.test("/ should return the expected response", async () => {
  await superdeno(app).get("/")
    .expect(200)
    .expect("Cache-Control", "max-age=86400")
    .expect("Set-Cookie", "requested_method=GET")
    .expect({
      foo: "bar",
      isLol: true,
    });
});
```

## Example Apps

As well as the [example app found in this repo](https://github.com/reno-router/reno/tree/v{{version}}/example), which is targetted by the end-to-end test suite, there is a [standalone repository for a blog microservice](https://github.com/reno-router/blog-microservice) built with Deno, Reno, PostgreSQL, and Docker.

## API Documentation

Consult [Reno's entry on the Deno Doc website](https://doc.deno.land/https/deno.land/x/reno@v{{version}}/reno/mod.ts) for comprehensive documentation on Reno's API.

## Local Development

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `deno_versions.json`. To install the correct version, run:

```sh
# If Deno isn't currently installed...
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s v$(jq -r .deno deno_versions.json)

# ...or it it's already present on your system
deno upgrade --version $(jq -r .deno deno_versions.json)
```

You should also run `make install-types` to install the TypeScript definitions for Deno and any other third-party dependencies.

Then you can run:

* `make example-app`: starts the example server
* `make test`: runs the unit tests
* `make e2e`: runs the end-to-end tests
* `make lint`: lints the source code
* `make format`: formats the source code
* `make format-check`: checks the formatting of the source code
* `make generate-readme`: generates README.md from the template, into which the version number in the package metadata is injected

## Functionality Checklist

* [x] Path routing
* [x] Async route handlers
* [x] Error handling
* [x] Route params
* [x] Query params
* [x] Response helpers
* [x] JSON
* [x] Custom headers
* [x] Request bodies
* [x] Cookies
* [x] Streaming responses with [`Deno.Reader`](https://doc.deno.land/builtin/stable#Deno.Reader)
* [ ] Streaming request bodies
