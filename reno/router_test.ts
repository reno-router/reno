import { assert, assertStrictEquals, sinon } from "../deps.ts";
import {
  AugmentedRequest,
  createRouteMap,
  MissingRouteError,
  RouteHandler,
  routerCreator,
} from "./router.ts";
import { assertResponsesAreEqual } from "./testing.ts";
import { createServerRequest } from "../test_utils.ts";
import parsePath from "./pathparser.ts";

function createRouteStub(
  response: Response | Error,
) {
  const route = sinon.stub();

  response instanceof Error
    ? route.rejects(response)
    : route.resolves(response);

  return route as RouteHandler<AugmentedRequest>;
}

function createCookieWriterStub() {
  return sinon.stub();
}

Deno.test({
  name:
    "createRouter`s routing function should invoke a handler for a given path from the provided map, and call the cookie writer and path parser",
  async fn() {
    const response = new Response();
    const routePath = "/foo";
    const routeRegExp = /\/foo$/;

    const routeStub = createRouteStub(response);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(parsePath, cookieWriter);
    const router = createRouter(createRouteMap([[routeRegExp, routeStub]]));
    const request = await createServerRequest({ path: routePath });

    const actualResponse = await router(request);

    await assertResponsesAreEqual(actualResponse, response);

    assert(cookieWriter.called);
  },
});

Deno.test({
  name:
    "createRouter`s routing function should expose wildcards as path params",
  async fn() {
    const response = new Response();
    const routePath = "/foo/*/bar/*/baz";
    const requestPath = "/foo/one/bar/two/baz";

    const routeStub = createRouteStub(response);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(parsePath, cookieWriter);
    const router = createRouter(createRouteMap([[routePath, routeStub]]));
    const request = await createServerRequest({ path: requestPath });

    const actualResponse = await router(request);

    await assertResponsesAreEqual(actualResponse, response);

    assert(cookieWriter.called);
  },
});

Deno.test({
  name: "createRouter`s routing function should support nested routers",
  async fn() {
    const response = new Response();
    const path = "/foo/bar/baz?lol=rofl&rofl=lmao";
    const routeStub = createRouteStub(response);
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(parsePath, cookieWriter);

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

    await assertResponsesAreEqual(actualResponse, response);
  },
});

Deno.test({
  name:
    "createRouter`s routing function should reject with a RouteMissingError when no routes match",
  async fn() {
    const mismatchedRequest = await createServerRequest({ path: "/foo-bar" });
    const routeStub = sinon.stub() as RouteHandler<AugmentedRequest>;
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(parsePath, cookieWriter);
    const router = createRouter(createRouteMap([[/^\/foo$/, routeStub]]));

    // TODO: migrate all of this to async/await
    await router(mismatchedRequest)
      .then(() => Promise.reject(new Error("Should have caught an error!")))
      .catch((e) => {
        assertStrictEquals(
          e instanceof MissingRouteError,
          true,
          "Expected error to be RouteMissingError",
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
    const routeStub = createRouteStub(new Error("Some error!"));
    const cookieWriter = createCookieWriterStub();
    const createRouter = routerCreator(parsePath, cookieWriter);
    const router = createRouter(createRouteMap([[/\/foo$/, routeStub]]));

    await router(mismatchedRequest).catch((e) => {
      assertStrictEquals(e instanceof Error, true);
      assertStrictEquals(e.message, "Some error!");
    });
  },
});
