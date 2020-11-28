import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

const decoder = new TextDecoder();

function isReader(body?: string | Deno.Reader): body is Deno.Reader {
  return Boolean((body as Deno.Reader).read);
}

function createResWithStringifiedBody(
  res: AugmentedResponse,
  body: Uint8Array,
) {
  return {
    ...res,
    body: decoder.decode(body),
  };
}

async function stringifyBody(
  res: AugmentedResponse,
): Promise<AugmentedResponse | void> {
  if (res.body instanceof Uint8Array) {
    return createResWithStringifiedBody(res, res.body);
  }
  if (isReader(res.body)) {
    return createResWithStringifiedBody(res, await Deno.readAll(res.body));
  }

  return res;
}

export function createAssertResponsesAreEqual(assertEqls: typeof assertEquals) {
  return async function (
    actual: AugmentedResponse,
    expected: AugmentedResponse,
  ): Promise<void> {
    const [actualMapped, expectedMapped] = await Promise.all(
      [actual, expected].map((res) => stringifyBody(res)),
    );

    assertEqls(actualMapped, expectedMapped);
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

/**
 * @deprecated **As of v1.2.0, you should use assertResponsesAreEqual()**
 *
 * A unit testing utility to assert that
 * the `body` and `headers` properties of
 * `actual` and `expected` are deeply equal.
 * Note this performs no processing on the body,
 * resulting in assertion failures printing the
 * raw body bytes to stdout; this really isn't
 * useful for debugging purposes.
 */
export function assertResponsesMatch(
  actual: AugmentedResponse,
  expected: AugmentedResponse,
) {
  console.warn(`

    ⚠ As of Reno v1.2.0, assertResponsesMatch has been deprecated. Please use assertResponsesAreEqual() instead!
  `);

  assertEquals(
    ...([actual, expected].map((res) => ({
      body: res.body,
      headers: res.headers && new Map(res.headers), // So that headers are deeply compared
    })) as [unknown, unknown]),
  );
}
