import { assertThrowsAsync, AssertionError, StringReader } from "../deps.ts";
import { textResponse, streamResponse } from "./helpers.ts";
import { assertResponsesAreEqual } from "./testing.ts";

/* These tests are a bit strange as they are
 * indirectly testing assertEquals' failure
 * messages. However, we need a means of
 * verifying that we're converting all of the
 * underlying body types to strings before
 * delegating. If assertEquals' message format
 * changes too often and these tests thus prove
 * brittle then I'll probably inject a stub
 * to keep everything better isolated. */

Deno.test({
  name: "assertResponsesAreEqual should output Uint8Array bodies as human-readable strings when the assertion fails",
  async fn() {
    const a = textResponse("Response body A");
    const b = textResponse("Response body B");

    await assertThrowsAsync(
      () => assertResponsesAreEqual(a, b),
      AssertionError,
      `-   { headers: Headers { content-type: text/plain }, body: "Response body A" }
+   { headers: Headers { content-type: text/plain }, body: "Response body B" }`,
    );
  },
});

Deno.test({
  name: "assertResponsesAreEqual should output Deno.Reader bodies as human-readable strings when the assertion fails",
  async fn() {
    const a = streamResponse(new StringReader("Response body A"));
    const b = streamResponse(new StringReader("Response body B"));

    await assertThrowsAsync(
      () => assertResponsesAreEqual(a, b),
      AssertionError,
      `-   { headers: Headers {}, body: "Response body A" }
+   { headers: Headers {}, body: "Response body B" }`,
    );

  },
});

Deno.test({
  name: "assertResponsesAreEqual should output string bodies as human-readable strings when the assertion fails",
  async fn() {
    const a = { body: "Response body A" };
    const b = { body: "Response body B" };

    await assertThrowsAsync(
      () => assertResponsesAreEqual(a, b),
      AssertionError,
      `-   { body: "Response body A" }
+   { body: "Response body B" }`,
    );

  },
});
