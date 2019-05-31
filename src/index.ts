import {
  serve,
  ServerRequest,
} from 'https://deno.land/std@v0.7/http/server.ts';
import app from './app.ts';

const BINDING = ':8000';

(async () => {
  console.log(`Listening for requests on ${BINDING}...`);

  for await (const req of serve(BINDING)) {
    await app(req);
  }
})();
