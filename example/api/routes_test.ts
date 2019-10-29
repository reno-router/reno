import { test } from "https://deno.land/std@v0.20.0/testing/mod.ts";

import {
  assertEquals
} from "https://deno.land/std@v0.20.0/testing/asserts.ts";

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
      // TODO: headers aren't deeply matched. Raise a PR in testing lib or find a workaround
      "X-Foo": "bar"
    }));
  }
})