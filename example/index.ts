import {
  ServerRequest,
  serve
} from "https://deno.land/std@v0.20.0/http/server.ts";

import { createRouter, NotFoundError } from "../reno/mod.ts";
import { routes } from "./routes.ts";

const BINDING = ":8000";

const encoder = new TextEncoder();

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  });

const logRequest = (req: ServerRequest) => {
  console.log(`[${formatDate(new Date())}] Request for ${req.url}`);
};

const createErrorResponse = (status: number, { message }: Error) => ({
  status,
  headers: new Headers({
    "Content-Type": "text/plain"
  }),
  body: encoder.encode(message)
});

// TODO: use HTTP's Status enum
const notFound = (e: NotFoundError) => createErrorResponse(404, e);
const serverError = (e: Error) => createErrorResponse(500, e);

const mapToErrorResponse = (e: Error) =>
  e instanceof NotFoundError ? notFound(e) : serverError(e);

const router = createRouter(routes);

(async () => {
  console.log(`Listening for requests on ${BINDING}...`);

  for await (const req of serve(BINDING)) {
    logRequest(req);

    const response = await router(req).catch(mapToErrorResponse);

    /* TODO: like the conditional branch in router,
     * this is another workaround to support streaming
     * responses. We should write a common abstraction
     * over responses or some sort of adapter so we can
     * remove these two conditional branches. */
    if (typeof response !== 'number') {
      req.respond(response);
    }
  }
})();
