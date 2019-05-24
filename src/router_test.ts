import { test } from "https://deno.land/std/testing/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Response } from 'https://deno.land/std@v0.5/http/server.ts';
import { ProtectedRequest, RouteMap, createRouter } from './router.ts';

// TODO: avoid any
interface StubCall<TReturn, TArgs extends any[]> {
  args: TArgs,
  returnValue: TReturn,
}

/* TODO: add functionality
 * as it's required. */
const createStub = <TReturn, TArgs extends any[]>() => {
  const calls: StubCall<TReturn, TArgs>[] = [];
  let returnValue: TReturn = undefined;

  const fn = (...args: TArgs) => {
    calls.push({ args, returnValue });
    return returnValue;
  };

  return {
    fn,

    get calls() {
      return [...calls];
    },

    set returnValue (val: TReturn) {
      returnValue = val;
    },

    assertWasCalledWith: (expectedCalls: TArgs) =>
      assertEquals(
        expectedCalls,
        calls.map(({ args }) => args),
      ),
  };
};

test({
  name: 'createRouter`s routing function should invoke a handler for a given path from the provided map',
  async fn() {
    const routeStub = createStub<Promise<Response>, [ProtectedRequest]>();

    const response = {
      headers: new Headers(),
      body: new Uint8Array(),
    };

    const routes = new RouteMap([
      [/\/foo$/, routeStub.fn],
    ]);

    const router = createRouter(routes);

    const baseRequest = {
      pipelineId: 0,
      method: 'GET',
      proto: '',
      headers: new Headers(),
      conn: {} as DenoConn,
      r: {} as Deno.Reader,
      w: {} as Deno.Writer,
      bodyStream: () => [],
      body: () => Promise.resolve(new Uint8Array),
      respond: () => Promise.resolve(),
    };

    const request = {
      ...baseRequest,
      url: '/foo',
    };

    const protectedRequest = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      bodyStream: request.bodyStream,
      queryParams: new URLSearchParams(),
      routeParams: [],
    };

    const mismatchedRequest = {
      ...baseRequest,
      url: '/foo-bar',
    };

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);
    await router(mismatchedRequest);

    assertEquals(actualResponse, response);

    routeStub.assertWasCalledWith([
      [protectedRequest],
    ]);
  },
});
