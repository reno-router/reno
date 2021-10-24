import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

export function createResponseSubset(
  {
    status,
    statusText,
    cookies,
    headers,
    ok,
    redirected,
    type,
  }: AugmentedResponse,
  body: string,
) {
  return {
    status,
    statusText,
    cookies,
    headers,
    ok,
    redirected,
    type,
    body,
  };
}

export function createAssertResponsesAreEqual(assertEqls: typeof assertEquals) {
  return async function (
    actual: AugmentedResponse,
    expected: AugmentedResponse,
  ): Promise<void> {
    const [actualText, expectedText] = await Promise.all(
      [actual, expected].map((res) => res.text()),
    );

    /* It seems that deeply comparing the requests always fails
     * so we instead have to match a subset of their fields. */
    assertEqls(
      createResponseSubset(actual, actualText),
      createResponseSubset(expected, expectedText),
    );
  };
}

/**
 * A unit testing utility to assert that
 * `actual` and `expected` are deeply equal.
 * The benefit of using this function over
 * `assertEquals` directly is that it will
 * convert `ReadableStream` bodies
 * to strings, making them human-readable
 * and thus helping to debug assertion failures:
 *
 * ```ts
 * const response = await ronSwansonQuoteHandler(req);
 *
 * await assertResponsesAreEqual(
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
