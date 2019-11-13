import { test } from "https://deno.land/std@v0.23.0/testing/mod.ts";

import {
  assertEquals
} from "https://deno.land/std@v0.23.0/testing/asserts.ts";

import { createStub } from "../../test_utils.ts";
import { jsonResponse } from "../../reno/mod.ts";
import { createRonSwansonQuoteHandler } from './routes.ts';

test({
  name: "ronSwansonQuoteHandler should fetch a quote from an API and return it",
  async fn() {
    const stubFetch = createStub<Promise<Pick<Response, 'json'>>, [string]>();
    const quotes = ["Some Ron Swanson Quote"];
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(stubFetch.fn);

    const req = {
      routeParams: []
    };

    stubFetch.returnValue = Promise.resolve({
      json: () => Promise.resolve(quotes)
    });

    const response = await ronSwansonQuoteHandler(req);

    assertEquals(response, jsonResponse(quotes, {
      /* Headers aren't deeply matched right now,
       * but will be with the next Deno release.
       * TODO: verify with next Deno version when available */
      "X-Foo": "baz"
    }));
  }
});

test({
  name: "ronSwansonQuoteHandler should fetch the number of quotes specified in the route params if present",
  async fn() {
    const quotesCount = 5;
    const stubFetch = createStub<Promise<Pick<Response, 'json'>>, [string]>();
    const quotes = Array(quotesCount).fill("Some Ron Swanson Quote");
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(stubFetch.fn);

    const req = {
      routeParams: [`${quotesCount}`]
    };

    stubFetch.returnValue = Promise.resolve({
      json: () => Promise.resolve(quotes)
    });

    const response = await ronSwansonQuoteHandler(req);

    assertEquals(response, jsonResponse(quotes, {
      "X-Foo": "bar"
    }));

    stubFetch.assertWasCalledWith([
      [`https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`]
    ]);
  }
});
