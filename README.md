# Deno Playground

This repository serves as my scratchpad for building a HTTP server with [Deno](https://deno.land/). Building upon Deno's substantial [HTTP module](https://github.com/denoland/deno_std/tree/master/http), this project introduces a thin routing layer for forwarding particular requests to asynchronous handler functions; one it reaches a point of maturity alongside the runtime, I'll release this as a standalone library.

## Running Locally

Once you've cloned the repository, you'll need to ensure you're running the version of Deno against which this project is developed; this is stored in `.deno-version`. To install the correct version, run:

```sh
$ curl -fsSL https://deno.land/x/install/install.sh | sh -s $(cat .deno-version)
```

Then you can run:

* `deno run src/index.ts` - starts the server
* `deno run tests.ts` - runs the unit tests

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