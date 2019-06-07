import { RouteMap, jsonResponse } from '../reno/mod.ts';
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
