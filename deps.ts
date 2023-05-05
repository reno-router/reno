// Recommended as per https://deno.land/std/manual.md#linking-to-third-party-code

export * from "https://deno.land/std@0.186.0/testing/asserts.ts";
export * from "https://deno.land/std@0.186.0/io/mod.ts";
export * from "https://deno.land/std@0.186.0/http/cookie.ts";
export { readableStreamFromReader } from "https://deno.land/std@0.186.0/streams/readable_stream_from_reader.ts"

export * as sinon from "https://cdn.skypack.dev/sinon@v14.0.0";
