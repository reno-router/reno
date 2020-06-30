import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

/**
 * A unit testing utility to assert that
 * the `body` and `headers` properties of
 * `actual` and `expected` are deeply equal.
 * In the future, the bodies will be serialised
 * into strings prior to comparison to clarify
 * body mismatches when an assertion fails.
 */
export function assertResponsesMatch(
  /**
   * The actual response returned
   * by the unit under test
   */
  actual: AugmentedResponse,
  /**
   * The expected response, typically
   * hard-coded in the test suite
   */
  expected: AugmentedResponse,
) {
  assertEquals(
    ...([actual, expected].map((res) => ({
      body: res.body,
      headers: res.headers && new Map(res.headers), // So that headers are deeply compared
    })) as [unknown, unknown]),
  );
}
