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

Deno.test({
  name: "forMethod should forward a request to a handler function based upon its HTTP method",
  async fn() {
    const req = await createAugmentedRequest({
      path: "/foo",
      method: 'POST',
    });

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

    const res = await methodRouter(req);

    assertResponsesMatch(res, postResponse);

    testdouble.verify(getHandler(req), {
      times: 0,
    });

    testdouble.verify(putHandler(req), {
      times: 0,
    });
  },
});
