import { ServerRequest } from 'https://deno.land/std@v0.7/http/server.ts';
import { routes } from './routes.ts';
import { createRouter } from './router.ts';

const router = createRouter(routes);

const app = async (req: ServerRequest) => {
  req.respond(await router(req));
};

export default app;
