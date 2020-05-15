import { sinon, assertEquals } from "../../deps.ts";
import { jsonResponse, assertResponsesMatch } from "../../reno/mod.ts";
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

    assertResponsesMatch(
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

    assertResponsesMatch(
      response,
      jsonResponse(quotes, {
        "X-Foo": "bar",
      }),
    );

    sinon.assert.calledOnce(fetchStub);

    sinon.assert.calledWithExactly(
      fetchStub,
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );
  },
});
