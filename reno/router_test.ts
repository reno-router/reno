import { test } from "https://deno.land/std@v0.20.0/testing/mod.ts";
import {
  assertEquals,
  assertStrictEq
} from "https://deno.land/std@v0.20.0/testing/asserts.ts";
import {
  Response,
} from "https://deno.land/std@v0.20.0/http/server.ts";
import {
  NotFoundError,
  AugmentedRequest,
  AugmentedResponse,
  RouteMap,
  routerCreator
} from "./router.ts";
import { Stub, createStub, createServerRequest } from "../test_utils.ts";

const createRoutes = (stub: Stub<Promise<Response>, [AugmentedRequest]>) =>
  new RouteMap([[/\/foo$/, stub.fn]]);

test({
  name:
    "createRouter`s routing function should invoke a handler for a given path from the provided map, and call the cookie writer and path parser",
  async fn() {
    const response = {
      headers: new Headers(),
      body: new Uint8Array()
    };

    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();
    const pathParser = createStub<RegExp, [RegExp | string]>();
    const cookieWriter = createStub<void, [AugmentedResponse]>();
    const createRouter = routerCreator(pathParser.fn, cookieWriter.fn);
    const router = createRouter(createRoutes(routeStub));
    const request = await createServerRequest({ path: "/foo" });

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);

    assertEquals(actualResponse, response);

    const [augmentedRequest] = routeStub.calls[0].args;

    assertEquals(augmentedRequest.url, "/foo");
    assertEquals(augmentedRequest.routeParams, []);

    pathParser.assertWasCalledWith([
      [/\/foo$/],
    ]);

    cookieWriter.assertWasCalledWith([
      [actualResponse]
    ]);
  }
});

test({
  name: "createRouter`s routing function should support nested routers",
  async fn() {
    const response = {
      headers: new Headers(),
      body: new Uint8Array()
    };

    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();
    const pathParser = createStub<RegExp, [RegExp | string]>();
    const cookieWriter = createStub<void, [AugmentedResponse]>();
    const createRouter = routerCreator(pathParser.fn, cookieWriter.fn);

    const routes = new RouteMap([
      ["/foo/*", createRouter(new RouteMap([
        ["/bar/*", createRouter(new RouteMap([
          ["/baz", routeStub.fn]
        ]))]
      ]))]
    ]);

    const router = createRouter(routes);
    const request = await createServerRequest({ path: "/foo/bar/baz?lol=rofl&rofl=lmao" });

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);

    assertEquals(actualResponse, response);

    const [augmentedRequest] = routeStub.calls[0].args;

    assertEquals(augmentedRequest.url, "/foo/bar/baz?lol=rofl&rofl=lmao");
    assertEquals(augmentedRequest.routeParams, []);

    assertEquals([...augmentedRequest.queryParams.entries()], [
      ["lol", "rofl"],
      ["rofl", "lmao"]
    ]);

    pathParser.assertWasCalledWith([
      ["/foo/*"],
      ["/bar/*"],
      ["/baz"]
    ]);
  }
});

test({
  name:
    "createRouter`s routing function should reject with a NotFoundError when no routes match",
  async fn() {
    const mismatchedRequest = await createServerRequest({ path: "/foo-bar" });
    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();
    const createRouter = routerCreator(createStub<RegExp, [string]>().fn, createStub().fn);
    const router = createRouter(createRoutes(routeStub));

    await router(mismatchedRequest).catch(e => {
      assertStrictEq(e instanceof NotFoundError, true);
      assertStrictEq(e.message, "No match for /foo-bar");
    });
  }
});

test({
  name:
    "createRouter`s routing function should forward route handler rejections",
  async fn() {
    const mismatchedRequest = await createServerRequest({ path: "/foo" });
    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();
    const createRouter = routerCreator(createStub<RegExp, [string]>().fn, createStub().fn);
    const router = createRouter(createRoutes(routeStub));

    routeStub.returnValue = Promise.reject(new Error("Some error!"));

    await router(mismatchedRequest).catch(e => {
      assertStrictEq(e instanceof Error, true);
      assertStrictEq(e.message, "Some error!");
    });
  }
});
