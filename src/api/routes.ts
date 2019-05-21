import { createRouter, RouteMap, json } from '../router.ts';
import { ProtectedRequest } from '../router.ts';

const ronSwansonQuote = async (req: ProtectedRequest) => {
  const [quotesCount = '1'] = req.routeParams;

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
