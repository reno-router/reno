import { ServerRequest } from "https://deno.land/std@0.105.0/http/server.ts";

import { createRouter, NotFoundError, textResponse } from "../reno/mod.ts";
import { routes } from "./routes.ts";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function logRequest(req: ServerRequest) {
  console.log(`[${formatDate(new Date())}] Request for ${req.url}`);
}

function createErrorResponse(status: number, { message }: Error) {
  return textResponse(message, {}, status);
}

function notFound(e: NotFoundError) {
  return createErrorResponse(404, e);
}

function serverError(e: Error) {
  return createErrorResponse(500, e);
}

function mapToErrorResponse(e: Error) {
  return e instanceof NotFoundError ? notFound(e) : serverError(e);
}

const router = createRouter(routes);

export default async function app(req: ServerRequest) {
  logRequest(req);

  try {
    const res = await router(req);
    return req.respond(res);
  } catch (e) {
    return req.respond(mapToErrorResponse(e));
  }
}
