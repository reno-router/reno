import { assertThrows, AssertionError } from "../deps.ts";
import { textResponse } from "./helpers.ts";
import { assertResponsesMatch } from "./testing.ts";

Deno.test({
  name: "assertResponsesMatch should output the Uint8Array bodies as human-readable strings when the assertion fails",
  async fn() {
    const a = textResponse("Response body A");
    const b = textResponse("Response body B");

    assertThrows(
      () => assertResponsesMatch(a, b),
      AssertionError,
      `-   { body: "Response body A", headers: Map { "content-type" => "text/plain" } }
+   { body: "Response body B", headers: Map { "content-type" => "text/plain" } }`,
    );
  },
});
