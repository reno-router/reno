# Reno

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://github.com/denoland/deno_std/tree/master/http).

```ts
import { serve } from 'https://deno.land/std@v0.20.0/http/server.ts';

import {
  createRouter,
  AugmentedRequest,
  RouteMap,
  textResponse,
  jsonResponse,
} from 'https://raw.githubusercontent.com/jamesseanwright/reno/v0.0.2/reno/mod.ts';

const encoder = new TextEncoder();

export const routes = new RouteMap([
  [/^\/$/, () => textResponse('Hello world!')],

  [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
    const [quotesCount = '1'] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    return jsonResponse(await res.json());
  }],
]);

const router = createRouter(routes);

(async () => {
  console.log('Listening for requests...');

  for await (const req of serve(':8001')) {
    req.respond(await router(req));
  }
})();
```

## Local Development

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `.deno-version`. To install the correct version, run:

```sh
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s $(cat .deno-version)
```

Then you can run:

* `deno example/index.ts` - starts the example server
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

## Is middleware support planned?

No. While [middleware](https://expressjs.com/en/guide/using-middleware.html) enables one to perform common logic and mutations upon request and response references, my personal experience with this pattern demonstrates that it scales poorly in larger codebases. I've thus omitted such a mechanism in to promote the explicit declaration of said common logic in a bid to localise it to expected sites. For instance:

```ts
const app = async (req: ServerRequest) => {
  logRequest(req);

  req.respond(
    await router(req).catch(e =>
      e instanceof NotFoundError ? notFound(e) : serverError(e),
    ),
  );
};
```

Without having to mentally grok the flow of a request within a chain of middlewares, we're able to build foundational functionality around our router. Want to serve error respones? Handle `Promise` rejections with `#catch`. Want to `log` requests? Call your logger of choice explicitly before forwarding a request to the router.

There are certainly instances in which the middleware pattern _can_ be beneficial, but I believe it compromises the ability to explicitly declare intent. I'll provide more examples as I further flesh out this project.
