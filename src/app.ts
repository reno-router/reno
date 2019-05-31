import { ServerRequest } from 'https://deno.land/std@v0.7/http/server.ts';
import { routes } from './routes.ts';
import { createRouter, NotFoundError } from './router.ts';

const router = createRouter(routes);

// TODO: should these live here?
const createErrorResponse = (
  status: number,
  { message }: Error,
) => ({
  status,
  headers: new Headers({
    'Content-Type': 'text/plain',
  }),
  body: new TextEncoder().encode(message), // TODO: share encoder?!
});

const notFound = (e: NotFoundError) =>
  createErrorResponse(404, e);

const serverError = (e: Error) =>
  createErrorResponse(500, e);

const app = async (req: ServerRequest) => {
  /* If error handling is exposed
   * via promises, then perhaps
   * user is responsible for setting
   * up Deno HTTP server initially?
   * I.e. is this lib merely a thin
   * routing layer upon Deno?! */
  req.respond(
    await router(req)
      .catch(e => e instanceof NotFoundError
        ? notFound(e)
        : serverError(e)
      ),
  );
};

export default app;
