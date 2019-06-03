import { StringReader } from 'https://deno.land/std@v0.7/io/readers.ts';
import colossalJson from './colossal.json';
import { ProtectedRequest, createRouter, RouteMap, json } from '../router.ts';

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
const colossal = () => ({
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  body: new TextEncoder().encode(serialised),
});

/* TODO: is it possible to pipe
 * fetch responses to the
 * requests's response body? */
const ronSwansonQuote = async (req: ProtectedRequest) => {
  const [quotesCount = '1'] = req.routeParams;

  const res = await fetch(
    `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
  );

  const quotes = await res.json();

  return json(quotes, {
    'X-Foo': 'bar',
  });
};

const routes = new RouteMap([
  [/\/colossal$/, colossal],
  [/\/ron-swanson-quote\/?([0-9]?)$/, ronSwansonQuote],
]);

export const apiRouter = createRouter(routes);
