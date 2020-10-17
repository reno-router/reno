import { testdouble } from "../../deps.ts";
import { assertResponsesAreEqual, jsonResponse } from "../../reno/mod.ts";
import { createRonSwansonQuoteHandler } from "./routes.ts";

function createFetchStub(response: string[]) {
  const fetch = testdouble.func();
  const json = testdouble.func();

  testdouble.when(json()).thenResolve(response);

  testdouble.when(fetch(
    `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${response.length}`,
  )).thenResolve({ json });

  return fetch as unknown as typeof window.fetch;
}

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

Deno.test({
  name:
    "ronSwansonQuoteHandler should fetch the number of quotes specified in the route params if present",
  async fn() {
    const quotesCount = 5;
    const quotes = Array(quotesCount).fill("Some Ron Swanson Quote");
    const fetchStub = createFetchStub(quotes);
    const ronSwansonQuoteHandler = createRonSwansonQuoteHandler(fetchStub);

    const req = {
      routeParams: [`${quotesCount}`],
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
