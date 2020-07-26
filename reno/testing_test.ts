import {
  assertThrowsAsync,
  AssertionError,
  StringReader,
  testdouble,
} from "../deps.ts";
import type { assertEquals } from "../deps.ts";
import { textResponse, streamResponse } from "./helpers.ts";
import { createAssertResponsesAreEqual } from "./testing.ts";
import { AugmentedResponse } from "./router.ts";

function createAssertEquals() {
  return testdouble.func("assertEqls") as typeof assertEquals;
}

Deno.test({
  name:
    "assertResponsesAreEqual should output Uint8Array bodies as human-readable strings when the assertion fails",
  async fn() {
    const assertEqls = createAssertEquals();
    const a = textResponse("Response body A");
    const b = textResponse("Response body B");

    const [aMapped, bMapped] = [a, b].map(({ body, ...rest }) => ({
      ...rest,
      body: new TextDecoder().decode(body),
    }));

    await createAssertResponsesAreEqual(assertEqls)(a, b);

    testdouble.verify(assertEqls(aMapped, bMapped));
  },
});

Deno.test({
  name:
    "assertResponsesAreEqual should output Deno.Reader bodies as human-readable strings when the assertion fails",
  async fn() {
    const assertEqls = createAssertEquals();
    const bodies = ["A", "B"].map((x) => `Response body ${x}`);
    const a = streamResponse(new StringReader("Response body A"));
    const b = streamResponse(new StringReader("Response body B"));

    const [aMapped, bMapped] = [a, b].map(({ body, ...rest }, i) => ({
      ...rest,
      body: bodies[i],
    }));

    const assertResponsesAreEqual = createAssertResponsesAreEqual(assertEqls);
    await assertResponsesAreEqual(a, b);

    testdouble.verify(assertEqls(aMapped, bMapped));
  },
});

Deno.test({
  name:
    "assertResponsesAreEqual should output string bodies as human-readable strings when the assertion fails",
  async fn() {
    const assertEqls = createAssertEquals();
    const a = { body: "Response body A" };
    const b = { body: "Response body B" };

    const assertResponsesAreEqual = createAssertResponsesAreEqual(assertEqls);
    await assertResponsesAreEqual(a, b);

    testdouble.verify(assertEqls(a, b));
  },
});
