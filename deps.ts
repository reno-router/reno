// Recommended as per https://deno.land/std/manual.md#linking-to-third-party-code

export * from "https://deno.land/std@0.132.0/testing/asserts.ts";
export * from "https://deno.land/std@0.132.0/io/mod.ts";
export * from "https://deno.land/std@0.132.0/http/cookie.ts";

import __jsTestDouble from "https://dev.jspm.io/testdouble@3.16.0";
import * as TestDouble from "https://raw.githubusercontent.com/testdouble/testdouble.js/ecd90efe4649b287c33831a7b94a8a5eb96b8ed0/index.d.ts";
export const testdouble: typeof TestDouble =
  __jsTestDouble as typeof TestDouble;
