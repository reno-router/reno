import { createRouter, MissingRouteError } from "../reno/mod.ts";
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

function logRequest(req: Request) {
  const { pathname } = new URL(req.url);
  console.log(`[${formatDate(new Date())}] Request for ${pathname}`);
}

function createErrorResponse(status: number, { message }: Error) {
  return new Response(message, {
    status,
  });
}

function notFound(e: MissingRouteError) {
  return createErrorResponse(404, e);
}

function serverError(e: Error) {
  return createErrorResponse(500, e);
}

function mapToErrorResponse(e: Error) {
  return e instanceof MissingRouteError ? notFound(e) : serverError(e);
}

const router = createRouter(routes);

export default async function app(req: Request) {
  logRequest(req);

  try {
    return await router(req);
  } catch (e) {
    return mapToErrorResponse(e);
  }
}
