import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

const decoder = new TextDecoder();

function isReader(body?: string | Deno.Reader): body is Deno.Reader {
  return Boolean((body as Deno.Reader).read);
}

function stringifyBody(body?: string | Uint8Array | Deno.Reader): string | undefined {
  if (body instanceof Uint8Array) {
    return decoder.decode(body);
  }
  if (isReader(body)) {
    return '';
  }

  return body;
}

/**
 * A unit testing utility to assert that
 * the `body` and `headers` properties of
 * `actual` and `expected` are deeply equal.
 * In the future, the bodies will be serialised
 * into strings prior to comparison to clarify
 * body mismatches when an assertion fails.
 */
export function assertResponsesMatch(
  actual: AugmentedResponse,
  expected: AugmentedResponse,
) {
  assertEquals(
    ...([actual, expected].map((res) => ({
      body: stringifyBody(res.body),
      headers: res.headers && new Map(res.headers), // So that headers are deeply compared
    })) as [unknown, unknown]),
  );
}
