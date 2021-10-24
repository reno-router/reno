import { testdouble } from "../deps.ts";
import type { assertEquals } from "../deps.ts";
import {
  createAssertResponsesAreEqual,
  createResponseSubset,
} from "./testing.ts";

function createAssertEquals() {
  return testdouble.func("assertEqls") as typeof assertEquals;
}

Deno.test({
  name:
    "assertResponsesAreEqual should output response bodies as human-readable strings when the assertion fails",
  async fn() {
    const assertEqls = createAssertEquals();

    const [a, b] = ["Response body A", "Response body B"]
      .map((body) => new Response(body));

    const assertResponsesAreEqual = createAssertResponsesAreEqual(assertEqls);
    await assertResponsesAreEqual(a, b);

    testdouble.verify(
      assertEqls(
        createResponseSubset(a, "Response body A"),
        createResponseSubset(b, "Response body B"),
      ),
    );
  },
});
