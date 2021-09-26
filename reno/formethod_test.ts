import { testdouble } from "../deps.ts";
import { forMethod, HttpMethod } from "./formethod.ts";
import { createAugmentedRequest } from "../test_utils.ts";
import { AugmentedRequest, RouteHandler } from "./router.ts";
import { assertResponsesAreEqual } from "./testing.ts";

function createRes(body: string, status = 200) {
  return new Response(body, {
    status,
  });
}

function createRouteStub(
  responseBody: string,
  expectedMethod: HttpMethod,
) {
  const route = testdouble.func() as RouteHandler<AugmentedRequest>;

  const stubber = testdouble
    .when(route(
      testdouble.matchers.contains({
        method: expectedMethod,
      }),
    ));

  const response = new Response(responseBody);

  response instanceof Error
    ? stubber.thenReject(response)
    : stubber.thenResolve(response);

  return route;
}

const createMethodRouter = () => {
  const getHandler = createRouteStub("Response for HTTP GET", "GET");
  const putHandler = createRouteStub("Response for HTTP PUT", "PUT");
  const postHandler = createRouteStub("Response for HTTP POST", "POST");

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
      testdouble.verify(handler(req), {
        times: 0,
      });
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
      testdouble.verify(handler(req), {
        times: 0,
      });
    });
  },
});
