import { RouteMap } from './router.ts';
import { apiRouter } from './api/routes.ts';
import { jsonResponse } from './json.ts';

const home = () =>
  jsonResponse({
    foo: 'bar',
    isLol: true,
  });

export const routes = new RouteMap([
  [/^\/$/, home],
  [/^\/api\/.*$/, apiRouter],
]);
