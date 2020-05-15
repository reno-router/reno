import { StringReader } from "https://deno.land/std@v0.51.0/io/readers.ts";

import colossalData from "./colossal.ts";

import {
  AugmentedRequest,
  createRouter,
  createRouteMap,
  JsonRequest,
  jsonResponse,
  textResponse,
  withJsonBody,
  streamResponse,
} from "../../reno/mod.ts";

interface JsonBody {
  foo: string;
  bar: number;
  baz: boolean;
}

type JsonBodyResponse = JsonBody & {
  message: string;
};

const methodNotAllowed = (url: string, method: string) => ({
  status: 405,
  ...textResponse(`Method ${method} not allowed for ${url}`),
});

const serialised = JSON.stringify(colossalData);

/* Returns a huge JSON response for timing
 * TTFB with different transfer methods
 *
 * Current TTFB timings (secs, averages
 * of 3 respective attempts) against
 * local MacBook Pro:
 * new StringReader(): 8 secs
 * TextEncoder#encode: 0.7 secs
 */
const colossal = () =>
  textResponse(serialised, {
    "Content-Type": "application/json",
  });

/* Handler to demonstrate request
 * body parsing with withJsonBody
 * higher-order function. Ideally
 * this would validate, but I feel
 * this should be handled by a
 * third-party dependency */
const jsonBody = withJsonBody(({ url, method, body }: JsonRequest<JsonBody>) =>
  method === "POST"
    ? jsonResponse<JsonBodyResponse>({
      message: "Here's the body you posted to this endpoint",
      ...body,
    })
    : methodNotAllowed(url, method)
);

export const createRonSwansonQuoteHandler = (
  fetch: (url: string) => Promise<Pick<Response, "json">>,
) =>
  async (req: Pick<AugmentedRequest, "routeParams">) => {
    const [quotesCount = "1"] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    const quotes = await res.json();

    return jsonResponse(quotes, {
      "X-Foo": "bar",
    });
  };

const setCookies = () => ({
  cookies: new Map([
    ["deno-playground-foo", "bar"],
    ["deno-playground-bar", "baz"],
  ]),
  ...textResponse("Cookies set!"),
});

const streamedResponse = async () =>
  streamResponse(
    new StringReader(
      "This was written directly to the request reference`s underlying socket!",
    ),
  );

// TODO: add handler for form data
const routes = createRouteMap([
  ["/colossal", colossal],
  ["/json-body", jsonBody],
  ["/set-cookies", setCookies],
  ["/streamed-response", streamedResponse],
  [
    /^\/ron-swanson-quote\/?([0-9]?)$/,
    createRonSwansonQuoteHandler(window.fetch),
  ],
]);

export const apiRouter = createRouter(routes);
