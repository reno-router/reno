import { StringReader } from "https://deno.land/std@v0.58.0/io/readers.ts";

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

function methodNotAllowed(url: string, method: string) {
  return {
    status: 405,
    ...textResponse(`Method ${method} not allowed for ${url}`),
  };
}

const serialised = JSON.stringify(colossalData);

function colossal() {
  return textResponse(serialised, {
    "Content-Type": "application/json",
  });
}

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

export function createRonSwansonQuoteHandler(
  fetch: (url: string) => Promise<Pick<Response, "json">>,
) {
  return async (req: Pick<AugmentedRequest, "routeParams">) => {
    const [quotesCount = "1"] = req.routeParams;

    const res = await fetch(
      `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
    );

    const quotes = await res.json();

    return jsonResponse(quotes, {
      "X-Foo": "bar",
    });
  };
}

function setCookies() {
  return {
    cookies: new Map([
      ["deno-playground-foo", "bar"],
      ["deno-playground-bar", "baz"],
    ]),
    ...textResponse("Cookies set!"),
  };
}

async function streamedResponse() {
  return streamResponse(
    new StringReader(
      "This was written directly to the request reference`s underlying socket!",
    ),
  );
}

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
