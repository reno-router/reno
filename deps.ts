// Recommended as per https://deno.land/std/manual.md#linking-to-third-party-code

// import __jsSinon from "https://dev.jspm.io/sinon@7.5.0";
// import Sinon from "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/949922e0959ccea0cad7a6fa787b63b7d4e67d3f/types/sinon/index.d.ts";
// export const sinon: Sinon.SinonStatic = __jsSinon;

export * from "https://deno.land/std@v0.51.0/testing/asserts.ts";
export * from "https://deno.land/std@v0.51.0/io/bufio.ts";

import __jsTestDouble from "https://dev.jspm.io/testdouble@3.16.0";
import * as TestDouble from "https://raw.githubusercontent.com/testdouble/testdouble.js/ecd90efe4649b287c33831a7b94a8a5eb96b8ed0/index.d.ts";
export const testdouble: typeof TestDouble = __jsTestDouble as typeof TestDouble;
