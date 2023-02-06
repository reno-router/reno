import { serve } from "https://deno.land/std@0.176.0/http/server.ts";

import app from "./app.ts";

const PORT = 8000;

console.log(`Listening for requests on ${PORT}...`);

await serve(app, {
  port: PORT,
});
