import { Response, testdouble, assertEquals, assertStrictEq } from "../deps.ts";
import { NotFoundError, createRouteMap, routerCreator, RouteHandler, AugmentedRequest } from "./router.ts";
import { assertResponsesMatch } from "./testing.ts";
import { createServerRequest } from "../test_utils.ts";
import parsePath from "./pathparser.ts";
import { writeCookies } from "./cookies.ts";

const createRouteStub = (response: Response, expectedRouteParams: string[]) => {
  const route = testdouble.func() as RouteHandler<AugmentedRequest>;

  testdouble
    .when(route(testdouble.matchers.contains({
      routeParams: expectedRouteParams,
    }), testdouble.matchers.anything(), testdouble.matchers.anything()))
    .thenResolve(response);

  return route;
};

const createPathParserSpy = (path: RegExp) => {
  const pathParser = testdouble.func() as typeof parsePath;

  testdouble
    .when(pathParser(path))
    .thenDo(parsePath);

  return pathParser;
};

const createCookieWriterStub = () =>
  testdouble.func() as typeof writeCookies;

Deno.test({
  name:
    "createRouter`s routing function should invoke a handler for a given path from the provided map, and call the cookie writer and path parser",
  async fn() {
    const response = {
      headers: new Headers(),
      body: new Uint8Array(),
    };

    const routePath = "/foo";
    const routeRegExp = /\/foo$/;

    const routeStub = createRouteStub(response, routePath, []);
    const pathParser = createPathParserSpy(routeRegExp);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(pathParser, cookieWriter);
    const router = createRouter(createRouteMap([[routeRegExp, routeStub]]));
    const request = await createServerRequest({ path: routePath });

    const actualResponse = await router(request);

    assertResponsesMatch(actualResponse, response);

    testdouble.verify(cookieWriter(actualResponse));
  },
});

// Deno.test({
//   name: "createRouter`s routing function should support nested routers",
//   async fn() {
//     const response = {
//       headers: new Headers(),
//       body: new Uint8Array(),
//     };

//     const routeStub = sinon.stub().resolves(response);
//     const pathParser = sinon.spy(parsePath);
//     const cookieWriter = sinon.stub();
//     const createRouter = routerCreator(pathParser, cookieWriter);

//     const routes = createRouteMap([
//       [
//         "/foo/*",
//         createRouter(
//           createRouteMap([
//             ["/bar/*", createRouter(createRouteMap([["/baz", routeStub]]))],
//           ]),
//         ),
//       ],
//     ]);

//     const router = createRouter(routes);
//     const request = await createServerRequest({
//       path: "/foo/bar/baz?lol=rofl&rofl=lmao",
//     });

//     const actualResponse = await router(request);

//     assertResponsesMatch(actualResponse, response);

//     const [augmentedRequest] = routeStub.firstCall.args;

//     assertEquals(augmentedRequest.url, "/foo/bar/baz?lol=rofl&rofl=lmao");
//     assertEquals(augmentedRequest.routeParams, []);

//     assertEquals(
//       [...augmentedRequest.queryParams.entries()],
//       [["lol", "rofl"], ["rofl", "lmao"]],
//     );

//     sinon.assert.calledThrice(pathParser);
//     sinon.assert.calledWithExactly(pathParser, "/foo/*");
//     sinon.assert.calledWithExactly(pathParser, "/bar/*");
//     sinon.assert.calledWithExactly(pathParser, "/baz");
//   },
// });

// Deno.test({
//   name:
//     "createRouter`s routing function should reject with a NotFoundError when no routes match",
//   async fn() {
//     const mismatchedRequest = await createServerRequest({ path: "/foo-bar" });
//     const routeStub = sinon.stub();
//     const createRouter = routerCreator(parsePath, sinon.stub());
//     const router = createRouter(createRouteMap([[/^\/foo$/, routeStub]]));

//     await router(mismatchedRequest)
//       .then(() => Promise.reject(new Error("Should have caught an error!")))
//       .catch((e) => {
//         assertStrictEq(
//           e instanceof NotFoundError,
//           true,
//           "Expected error to be NotFoundError",
//         );
//         assertStrictEq(e.message, "No match for /foo-bar");
//       });
//   },
// });

// Deno.test({
//   name:
//     "createRouter`s routing function should forward route handler rejections",
//   async fn() {
//     const mismatchedRequest = await createServerRequest({ path: "/foo" });
//     const routeStub = sinon.stub().rejects(new Error("Some error!"));
//     const createRouter = routerCreator(parsePath, sinon.stub());
//     const router = createRouter(createRouteMap([[/\/foo$/, routeStub]]));

//     await router(mismatchedRequest).catch((e) => {
//       assertStrictEq(e instanceof Error, true);
//       assertStrictEq(e.message, "Some error!");
//     });
//   },
// });
