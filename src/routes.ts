import { json, RouteMap } from './router.ts';
import { apiRouter } from './api/routes.ts';

const home = () =>
  json({
    foo: 'bar',
    isLol: true,
  });

export const routes = new RouteMap([
  [/^\/$/, home],
  // [/^\/api\/.*$/, apxiRouter],
]);
