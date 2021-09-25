import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

export function createAssertResponsesAreEqual(assertEqls: typeof assertEquals) {
  return async function (
    actual: AugmentedResponse,
    expected: AugmentedResponse,
  ): Promise<void> {
    const [actualText, expectedText] = await Promise.all(
      [actual, expected].map((res) => res.text()),
    );

    assertEqls(
      {
        ...actual,
        body: actualText,
      },
      {
        ...expected,
        body: expectedText,
      },
    );
  };
}

/**
 * A unit testing utility to assert that
 * `actual` and `expected` are deeply equal.
 * The benefit of using this function over
 * `assertEquals` directly is that it will
 * convert `Uint8Array` and `Deno.Reader` bodies
 * to strings, making them human-readable
 * and thus helping to debug assertion failures:
 *
 * ```ts
 * const response = await ronSwansonQuoteHandler(req);
 *
 * await assertResponseBodiesAreEqual(
 *   response,
 *   jsonResponse(quotes, {
 *     "X-Foo": "bar",
 *   }),
 * );
 * ```
 */
export function assertResponsesAreEqual(
  actual: AugmentedResponse,
  expected: AugmentedResponse,
): Promise<void> {
  return createAssertResponsesAreEqual(assertEquals)(actual, expected);
}
