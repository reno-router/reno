import { serve } from 'https://deno.land/std@v0.5/http/server.ts';
import app from './app.ts';

(async () => {
  for await (const req of serve(':8000')) {
    app(req);
  }
})();