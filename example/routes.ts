import { RouteMap } from '../reno/router.ts';
import { jsonResponse } from '../reno/json.ts';
import { apiRouter } from './api/routes.ts';

const home = () =>
  jsonResponse({
    foo: 'bar',
    isLol: true,
  });

export const routes = new RouteMap([
  [/^\/$/, home],
  [/^\/api\/.*$/, apiRouter],
]);
