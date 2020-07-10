import {
  Response,
  testdouble,
  assertStrictEquals,
} from "../deps.ts";
import {
  NotFoundError,
  createRouteMap,
  routerCreator,
  RouteHandler,
  AugmentedRequest,
} from "./router.ts";
import { assertResponsesMatch } from "./testing.ts";
import { createServerRequest } from "../test_utils.ts";
import parsePath from "./pathparser.ts";
import { writeCookies } from "./cookies.ts";

function isOneOf(items: (RegExp | string)[]) {
  return testdouble.matchers.argThat((arg: (RegExp | string)) =>
    items.some((item) => item.toString() === arg.toString())
  );
}

function createRouteStub(
  response: Response | Error,
  expectedPath: string,
  expectedRouteParams: string[],
) {
  const route = testdouble.func() as RouteHandler<AugmentedRequest>;

  const stubber = testdouble
    .when(route(
      testdouble.matchers.contains({
        url: expectedPath,
        routeParams: expectedRouteParams,
      }),
      testdouble.matchers.anything(),
      expectedRouteParams,
    ));

  response instanceof Error
    ? stubber.thenReject(response)
    : stubber.thenResolve(response);

  return route;
}

function createPathParserSpy(...paths: (RegExp | string)[]) {
  const pathParser = testdouble.func() as typeof parsePath;

  testdouble
    .when(pathParser(isOneOf(paths)))
    .thenDo(parsePath);

  return pathParser;
}

function createCookieWriterStub() {
  return testdouble.func() as typeof writeCookies;
}

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

Deno.test({
  name:
    "createRouter`s routing function should expose wildcards as path params",
  async fn() {
    const response = {
      headers: new Headers(),
      body: new Uint8Array(),
    };

    const routePath = "/foo/*/bar/*/baz";
    const requestPath = "/foo/one/bar/two/baz";

    const routeStub = createRouteStub(response, requestPath, ["one", "two"]);
    const pathParser = createPathParserSpy(routePath);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(pathParser, cookieWriter);
    const router = createRouter(createRouteMap([[routePath, routeStub]]));
    const request = await createServerRequest({ path: requestPath });

    const actualResponse = await router(request);

    assertResponsesMatch(actualResponse, response);

    testdouble.verify(cookieWriter(actualResponse));
  },
});

Deno.test({
  name: "createRouter`s routing function should support nested routers",
  async fn() {
    const response = {
      headers: new Headers(),
      body: new Uint8Array(),
    };

    const path = "/foo/bar/baz?lol=rofl&rofl=lmao";
    const routeStub = createRouteStub(response, path, []);
    const pathParser = createPathParserSpy("/foo/*", "/bar/*", "/baz");
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(pathParser, cookieWriter);

    const routes = createRouteMap([
      [
        "/foo/*",
        createRouter(
          createRouteMap([
            ["/bar/*", createRouter(createRouteMap([["/baz", routeStub]]))],
          ]),
        ),
      ],
    ]);

    const router = createRouter(routes);
    const request = await createServerRequest({
      path,
    });

    const actualResponse = await router(request);

    assertResponsesMatch(actualResponse, response);
  },
});

Deno.test({
  name:
    "createRouter`s routing function should reject with a NotFoundError when no routes match",
  async fn() {
    const mismatchedRequest = await createServerRequest({ path: "/foo-bar" });
    const routeStub = testdouble.func() as RouteHandler<AugmentedRequest>;
    const pathParser = createPathParserSpy();
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(pathParser, cookieWriter);
    const router = createRouter(createRouteMap([[/^\/foo$/, routeStub]]));

    // TODO: migrate all of this to async/await
    await router(mismatchedRequest)
      .then(() => Promise.reject(new Error("Should have caught an error!")))
      .catch((e) => {
        assertStrictEquals(
          e instanceof NotFoundError,
          true,
          "Expected error to be NotFoundError",
        );
        assertStrictEquals(e.message, "No match for /foo-bar");
      });
  },
});

Deno.test({
  name:
    "createRouter`s routing function should forward route handler rejections",
  async fn() {
    const path = "/foo";
    const mismatchedRequest = await createServerRequest({ path });
    const routeStub = createRouteStub(new Error("Some error!"), path, []);
    const pathParser = createPathParserSpy(/\/foo$/);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(pathParser, cookieWriter);
    const router = createRouter(createRouteMap([[/\/foo$/, routeStub]]));

    await router(mismatchedRequest).catch((e) => {
      assertStrictEquals(e instanceof Error, true);
      assertStrictEquals(e.message, "Some error!");
    });
  },
});
