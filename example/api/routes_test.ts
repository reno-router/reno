import { test } from "https://deno.land/std@v0.23.0/testing/mod.ts";

import {
  assertEquals
} from "https://deno.land/std@v0.23.0/testing/asserts.ts";

import { sinon } from '../../deps.ts';
import { jsonResponse, assertResponsesMatch } from "../../reno/mod.ts";
import { createRonSwansonQuoteHandler } from './routes.ts';

const createStubFetch = (response: string[]) =>
  sinon.stub().resolves({
    json: sinon.stub().resolves(response),
  });

test({
  name: "ronSwansonQuoteHandler should fetch a quote from an API and return it",
  async fn() {
    const quotes = ["Some Ron Swanson Quote"];
    const stubFetch = createStubFetch(quotes);
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(stubFetch);

    const req = {
      routeParams: []
    };

    const response = await ronSwansonQuoteHandler(req);

    assertResponsesMatch(response, jsonResponse(quotes, {
      "X-Foo": "bar"
    }));
  }
});

test({
  name: "ronSwansonQuoteHandler should fetch the number of quotes specified in the route params if present",
  async fn() {
    const quotesCount = 5;
    const quotes = Array(quotesCount).fill("Some Ron Swanson Quote");
    const stubFetch = createStubFetch(quotes);
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(stubFetch);

    const req = {
      routeParams: [`${quotesCount}`]
    };

    const response = await ronSwansonQuoteHandler(req);

    assertEquals(response, jsonResponse(quotes, {
      "X-Foo": "bar"
    }));

    sinon.assert.calledOnce(stubFetch);

    sinon.assert.calledWithExactly(
      stubFetch,
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`
    );
  }
});
