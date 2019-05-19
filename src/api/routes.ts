import { createRouter, RouteMap, json } from '../router.ts';

const ronSwansonQuote = async () => {
  const res = await fetch('https://ron-swanson-quotes.herokuapp.com/v2/quotes');
  const [quote] = await res.json();

  return json({
    quote,
  });
};

const routes = new RouteMap([
  // TODO: express-style sub-routing, route params
  ['/api/ron-swanson-quote', ronSwansonQuote],
]);

export const apiRouter = createRouter(routes);
