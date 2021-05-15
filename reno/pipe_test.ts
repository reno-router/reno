import { pipe } from "./pipe.ts";
import { textResponse } from "./helpers.ts";
import { createAugmentedRequest } from "../test_utils.ts";
import { assertResponsesAreEqual } from "./testing.ts";

Deno.test({
  name:
    "pipe takes a set in input morphs and returns a higher-order route handler",
  async fn() {
    function handler() {
      return {
        ...textResponse("Foo"),
        status: 200,
      };
    }

    const withCaching = pipe(
      (_, res) => {
        res.headers = res.headers || new Headers();
        res.headers.append("Cache-Control", "max-age=86400");
      },
      (req, res) => ({
        ...res,
        cookies: new Map<string, string>([["requested_proto", req.proto]]),
      }),
    );

    const req = await createAugmentedRequest({
      path: "/foo",
    });

    const cachingHandler = withCaching(handler);
    const res = await cachingHandler(req);

    await assertResponsesAreEqual(res, {
      ...textResponse("Foo", {
        "Content-Type": "text/plain",
        "Cache-Control": "max-age=86400",
      }),
      status: 200,
      cookies: new Map<string, string>([["requested_proto", "HTTP/1.1"]]),
    });
  },
});
