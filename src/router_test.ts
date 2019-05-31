import { test } from "https://deno.land/std@v0.7/testing/mod.ts";
import { assertEquals } from "https://deno.land/std@v0.7/testing/asserts.ts";
import { ServerRequest, Response, readRequest } from 'https://deno.land/std@v0.7/http/server.ts';
import { BufReader } from 'https://deno.land/std@v0.7/io/bufio.ts';
import { TextProtoReader } from 'https://deno.land/std@v0.7/textproto/mod.ts';
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

const createArrayBuffer = (contents: string) => {
  const ab = new ArrayBuffer(contents.length);

  contents.split('').forEach((char, i) => {
    ab[i] = char;
  });

  return ab;
};

// TODO: body support, consume headers!
const createServerRequest = async (
  url: string,
  method = 'GET',
  headers = new Headers(),
) => {
  const request = `${method} ${url} HTTP/1.1
    Host: dummy-host
    Connection: keep-alive
    Content-Type: text/html
  `.trim();

  const ab = createArrayBuffer(request);
  const requestBuffer = new Deno.Buffer(ab);
  const bufReader = BufReader.create(requestBuffer);
  const tpr = new TextProtoReader(bufReader);

  console.log('***fff***', await tpr.readLine());


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

    // const protectedRequest = {
    //   url: '/foo',
    //   method: 'GET',
    //   headers: request.headers,
    //   body: request.body,
    //   bodyStream: request.bodyStream,
    //   queryParams: new URLSearchParams(),
    //   routeParams: [],
    // };

    routeStub.returnValue = Promise.resolve(response);

    const actualResponse = await router(request);
    await router(mismatchedRequest);

    assertEquals(actualResponse, response);

    // routeStub.assertWasCalledWith([
    //   [protectedRequest],
    // ]);
  },
});
