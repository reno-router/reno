import { test } from "https://deno.land/std@v0.7/testing/mod.ts";
import { assertEquals } from "https://deno.land/std@v0.7/testing/asserts.ts";
import { ServerRequest, Response, readRequest } from 'https://deno.land/std@v0.7/http/server.ts';
import { BufReader } from 'https://deno.land/std@v0.7/io/bufio.ts';
import { StringReader } from 'https://deno.land/std@v0.7/io/readers.ts';
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

    assertWasCalledWith: (expectedCalls: TArgs[]) =>
      assertEquals(
        expectedCalls,
        calls.map(({ args }) => args),
      ),
  };
};

// TODO: body support, consume headers!
const createServerRequest = async (
  path: string,
  method = 'GET',
  headers = new Headers(),
) => {
  const request = `${method} ${path} HTTP/1.1\n\n`;

  const bufReader = BufReader.create(
    new StringReader(request)
  );

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return await readRequest(bufReader) as ServerRequest;
}

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

    const request = await createServerRequest('/foo');
    const mismatchedRequest = await createServerRequest('/foo-bar');

    const protectedRequest = {
      url: '/foo',
      method: 'GET',
      headers: new Headers(),
      body: request.body,
      bodyStream: request.bodyStream,
      queryParams: new URLSearchParams(),
      routeParams: [],
    };

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);
    await router(mismatchedRequest);

    assertEquals(actualResponse, response);

    const [actualRequest] = routeStub.calls[0].args;

    assertEquals(actualRequest.url, '/foo');

    // routeStub.assertWasCalledWith([
    //   [protectedRequest],
    // ]);
  },
});
