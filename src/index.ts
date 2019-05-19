import {
  serve,
  ServerRequest,
} from 'https://deno.land/std@v0.5/http/server.ts';
import app from './app.ts';

const BINDING = ':8000';

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

const logRequest = (req: ServerRequest) => {
  console.log(`[${formatDate(new Date())}] Request for ${req.url}`);
};

(async () => {
  console.log(`Listening for requests on ${BINDING}...`);

  for await (const req of serve(BINDING)) {
    logRequest(req); // TODO: logger with standard interface, error logging etc.
    await app(req);
  }
})();
