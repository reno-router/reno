import { StringReader } from "https://deno.land/std@0.96.0/io/readers.ts";

import colossalData from "./colossal.ts";

import {
  AugmentedRequest,
  createRouteMap,
  createRouter,
  jsonResponse,
  streamResponse,
  textResponse,
  withJsonBody,
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
  return textResponse(`Method ${method} not allowed for ${url}`, {}, 405);
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
const jsonBody = withJsonBody<JsonBody>(({ url, method, body }) =>
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

function streamedResponse() {
  return streamResponse(
    new StringReader(
      "This was written directly to the request reference`s underlying socket!",
    ),
  );
}

function wildcardRouteParams(req: Pick<AugmentedRequest, "routeParams">) {
  const [authorId, postId] = req.routeParams;

  return textResponse(`You requested ${postId} by ${authorId}`);
}

// TODO: add handler for form data
const routes = createRouteMap([
  ["/colossal", colossal],
  ["/json-body", jsonBody],
  ["/set-cookies", setCookies],
  ["/streamed-response", streamedResponse],
  ["/wildcard-route-params/authors/*/posts/*", wildcardRouteParams],
  [
    /^\/ron-swanson-quote\/?([0-9]?)$/,
    createRonSwansonQuoteHandler(window.fetch),
  ],
]);

export const apiRouter = createRouter(routes);
