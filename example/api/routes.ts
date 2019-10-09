import colossalJson from "./colossal.json";
import {
  AugmentedRequest,
  createRouter,
  RouteMap,
  JsonRequest,
  jsonResponse,
  textResponse,
  withJsonBody
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
  ...textResponse(`Method ${method} not allowed for ${url}`)
});

const serialised = JSON.stringify(colossalJson);

/* Returns a huge JSON response for timing
 * TTFB with different transfer methods
 *
 * Current TTFB timings (secs, averages
 * of 3 respective attempts) against
 * local MacBook Pro:
 * new StringReader(): 8 secs
 * TextEncoder#encode: 0.7 secs
 */
const colossal = () => textResponse(serialised, {
  "Content-Type": "application/json"
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
        message: "Here`s the body you posted to this endpoint",
        ...body
      })
    : methodNotAllowed(url, method)
);

/* TODO: is it possible to pipe
 * fetch responses to the
 * requests's response body? */
const ronSwansonQuote = async (req: AugmentedRequest) => {
  const [quotesCount = "1"] = req.routeParams;

  const res = await fetch(
    `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`
  );

  const quotes = await res.json();

  return jsonResponse(quotes, {
    "X-Foo": "bar"
  });
};

const setCookies = () => ({
  cookies: new Map([
    ["deno-playground-foo", "bar"],
    ["deno-playground-bar", "baz"]
  ]),
  ...textResponse("Cookies set!")
});

// TODO: add handler for form data
const routes = new RouteMap([
  [/\/colossal$/, colossal],
  [/\/json-body$/, jsonBody],
  [/\/set-cookies$/, setCookies],
  [/\/ron-swanson-quote\/?([0-9]?)$/, ronSwansonQuote]
]);

export const apiRouter = createRouter(routes);
