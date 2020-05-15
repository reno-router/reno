// Recommended as per https://deno.land/std/manual.md#linking-to-third-party-code

import __jsSinon from "https://cdn.pika.dev/sinon@7.5.0";
import Sinon from "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/949922e0959ccea0cad7a6fa787b63b7d4e67d3f/types/sinon/index.d.ts";

export * from "https://deno.land/std@v0.51.0/testing/asserts.ts";
export * from "https://deno.land/std@v0.51.0/io/bufio.ts";

/* TODO: write TS/VS Code plugin to infer
 * types from @deno-types directive */
export const sinon: Sinon.SinonStatic = __jsSinon;
