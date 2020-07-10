import { Response, testdouble } from "../deps.ts";
import { forMethod, HttpMethod } from "./formethod.ts";
import { createAugmentedRequest } from "../test_utils.ts";
import { RouteHandler, AugmentedRequest } from "./router.ts";
import { textResponse } from "./helpers.ts";
import { assertResponsesMatch } from "./testing.ts";

function createRouteStub(
  response: Response | Error,
  expectedMethod: HttpMethod,
) {
  const route = testdouble.func() as RouteHandler<AugmentedRequest>;

  const stubber = testdouble
    .when(route(
      testdouble.matchers.contains({
        method: expectedMethod,
      }),
    ));

  response instanceof Error
    ? stubber.thenReject(response)
    : stubber.thenResolve(response);

  return route;
}

const getResponse = textResponse("Response for HTTP GET");
const putResponse = textResponse("Response for HTTP PUT");
const postResponse = textResponse("Response for HTTP POST");
const getHandler = createRouteStub(getResponse, 'GET');
const putHandler = createRouteStub(putResponse, 'PUT');
const postHandler = createRouteStub(postResponse, 'POST');

const methodRouter = forMethod([
  ["GET", getHandler],
  ["PUT", putHandler],
  ["POST", postHandler],
]);

Deno.test({
  name: "forMethod should forward a request to a handler function based upon its HTTP method",
  async fn() {
    const req = await createAugmentedRequest({
      path: "/foo",
      method: 'POST',
    });

    const res = await methodRouter(req);

    assertResponsesMatch(res, postResponse);

    [getHandler, putHandler].forEach(handler => {
      testdouble.verify(handler(req), {
        times: 0,
      });
    });
  },
});

Deno.test({
  name: "forMethod should response with HTTP 405 if a request's method isn't present in the mappings",
  async fn() {
    const req = await createAugmentedRequest({
      path: "/foo",
      method: 'PATCH',
    });

    const expectedRes = {
      ...textResponse(`Method PATCH not allowed for /foo`),
      status: 405,
    }

    const res = await methodRouter(req);

    assertResponsesMatch(res, expectedRes);

    [getHandler, putHandler, postHandler].forEach(handler => {
      testdouble.verify(handler(req), {
        times: 0,
      });
    });
  },
});
