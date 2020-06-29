import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

/**
 * A unit testing utility to Assert that
 * the `body` and `headers` properties of
 * `actual` and `expected` are deeply equal.
 * In the future, the bodies will be serialised
 * into strings prior to comparison to clarify
 * body mismatches when an assertion fails.
 */
export const assertResponsesMatch = (
  actual: AugmentedResponse,
  expected: AugmentedResponse,
) => {
  assertEquals(
    ...([actual, expected].map((res) => ({
      body: res.body,
      headers: res.headers && new Map(res.headers), // So that headers are deeply compared
    })) as [unknown, unknown]),
  );
};
