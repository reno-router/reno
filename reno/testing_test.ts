import { assert, sinon } from "../deps.ts";

import {
  createAssertResponsesAreEqual,
  createResponseSubset,
} from "./testing.ts";

Deno.test({
  name:
    "assertResponsesAreEqual should output response bodies as human-readable strings when the assertion fails",
  async fn() {
    const assertEqls = sinon.stub();

    const [a, b] = ["Response body A", "Response body B"]
      .map((body) => new Response(body));

    const assertResponsesAreEqual = createAssertResponsesAreEqual(assertEqls);
    await assertResponsesAreEqual(a, b);

    assert(
      assertEqls.calledWith(
        createResponseSubset(a, "Response body A"),
        createResponseSubset(b, "Response body B"),
      )
    )
  },
});
