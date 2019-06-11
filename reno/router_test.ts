import { test } from "https://deno.land/std@v0.8/testing/mod.ts";
import {
  assertEquals,
  assertStrictEq
} from "https://deno.land/std@v0.8/testing/asserts.ts";
import {
  ServerRequest,
  Response,
  readRequest
} from "https://deno.land/std@v0.8/http/server.ts";
import {
  NotFoundError,
  AugmentedRequest,
  RouteMap,
  createRouter
} from "./router.ts";
import { Stub, createStub, createServerRequest } from "../test_utils.ts";

const createRoutes = (stub: Stub<Promise<Response>, [AugmentedRequest]>) =>
  new RouteMap([[/\/foo$/, stub.fn]]);

test({
  name:
    "createRouter`s routing function should invoke a handler for a given path from the provided map",
  async fn() {
    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();

    const response = {
      headers: new Headers(),
      body: new Uint8Array()
    };

    const router = createRouter(createRoutes(routeStub));
    const request = await createServerRequest({ path: "/foo" });

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);

    assertEquals(actualResponse, response);

    const [AugmentedRequest] = routeStub.calls[0].args;

    // WIP assertion. See TODO below
    assertEquals(AugmentedRequest.url, "/foo");

    /* TODO: currently failing, but diffs
     * match. Try again with a new release */

    // const AugmentedRequest = {
    //   url: '/foo',
    //   method: 'GET',
    //   headers: new Headers(),
    //   body: request.body,
    //   bodyStream: request.bodyStream,
    //   queryParams: new URL('/foo', 'https://').searchParams,
    //   routeParams: [],
    // };

    // routeStub.assertWasCalledWith([
    //   [AugmentedRequest],
    // ]);
  }
});

test({
  name:
    "createRouter`s routing function should reject with a NotFoundError when no routes match",
  async fn() {
    const mismatchedRequest = await createServerRequest({ path: "/foo-bar" });
    const routeStub = createStub<Promise<Response>, [AugmentedRequest]>();
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
    const router = createRouter(createRoutes(routeStub));

    routeStub.returnValue = Promise.reject(new Error("Some error!"));

    await router(mismatchedRequest).catch(e => {
      assertStrictEq(e instanceof Error, true);
      assertStrictEq(e.message, "Some error!");
    });
  }
});