import { ServerRequest } from 'https://deno.land/std@v0.5/http/server.ts';
import { createRouter, RouteMap, json } from '../router.ts';

const ronSwansonQuote = async (
  req: ServerRequest,
  queryParams: URLSearchParams,
  quotesCount = '1',
) => {
  console.log('******', queryParams.get('foo'));

  const res = await fetch(
    `https://ron-swanson-quotes.herokuapp.com/v2/quotes/${quotesCount}`,
  );
  const quotes = await res.json();

  return json(quotes);
};

const routes = new RouteMap([
  [/\/ron-swanson-quote\/?([0-9]?)$/, ronSwansonQuote],
]);

export const apiRouter = createRouter(routes);
