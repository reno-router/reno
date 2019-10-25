# Reno

Reno is a thin routing library designed to sit on top of [Deno](https://deno.land/)'s [standard HTTP module](https://github.com/denoland/deno_std/tree/master/http).

```tsx
import { serve } from 'https://deno.land/std@v0.20.0/http/server.ts';

import {
  createRouter,
  AugmentedRequest,
  RouteMap,
  textResponse,
  jsonResponse,
  streamResponse,
} from 'https://raw.githubusercontent.com/jamesseanwright/reno/v0.2.0/reno/mod.ts';

export const routes = new RouteMap([
  ['/home', () => textResponse('Hello world!')],

  // Supports RegExp routes for further granularity
  [/^\/api\/swanson\/?([0-9]?)$/, async (req: AugmentedRequest) => {
    const [quotesCount = '1'] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    return jsonResponse(await res.json());
  }],

  // Supports Reader for streaming responses in chunks
  ['/streamed-response', () => streamResponse(
    new ReactReader(<App />),
  ],
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
* [x] Streaming responses with [`Reader`](https://deno.land/typedoc/interfaces/_deno_.reader.html)
* [ ] Streaming request bodies

## Is middleware support planned?

Not directly, but Reno will eventually export a `pipe` function to combine multiple route handlers.
