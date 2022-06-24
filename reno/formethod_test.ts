import { assert, sinon } from "../deps.ts";
import { forMethod } from "./formethod.ts";
import { createAugmentedRequest } from "../test_utils.ts";
import { assertResponsesAreEqual } from "./testing.ts";

function createRes(body: string, status = 200) {
  return new Response(body, {
    status,
  });
}

function createRouteStub(
  responseBody: string,
) {
  return sinon
    .stub()
    .resolves(new Response(responseBody));
}

const createMethodRouter = () => {
  const getHandler = createRouteStub("Response for HTTP GET");
  const putHandler = createRouteStub("Response for HTTP PUT");
  const postHandler = createRouteStub("Response for HTTP POST");

  const methodRouter = forMethod([
    ["GET", getHandler],
    ["PUT", putHandler],
    ["POST", postHandler],
  ]);

  return {
    getHandler,
    putHandler,
    postHandler,
    methodRouter,
  };
};

Deno.test({
  name:
    "forMethod should forward a request to a handler function based upon its HTTP method",
  async fn() {
    const {
      methodRouter,
      getHandler,
      putHandler,
    } = createMethodRouter();

    const req = await createAugmentedRequest({
      path: "/foo",
      method: "POST",
    });

    const res = await methodRouter(req);

    await assertResponsesAreEqual(res, createRes("Response for HTTP POST"));

    [getHandler, putHandler].forEach((handler) => {
      assert(!handler.called);
    });
  },
});

Deno.test({
  name:
    "forMethod should response with HTTP 405 if a request's method isn't present in the mappings",
  async fn() {
    const req = await createAugmentedRequest({
      path: "/foo",
      method: "PATCH",
    });

    const {
      methodRouter,
      postHandler,
      getHandler,
      putHandler,
    } = createMethodRouter();

    const expectedRes = createRes(`Method PATCH not allowed for /foo`, 405);

    const res = await methodRouter(req);

    await assertResponsesAreEqual(res, expectedRes);

    [getHandler, putHandler, postHandler].forEach((handler) => {
      assert(!handler.called);
    });
  },
});
