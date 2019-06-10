import { assertEquals } from 'https://deno.land/std@v0.8/testing/asserts.ts';
import { BufReader } from 'https://deno.land/std@v0.8/io/bufio.ts';
import {
  readRequest,
  ServerRequest,
} from 'https://deno.land/std@v0.8/http/server.ts';
import { StringReader } from 'https://deno.land/std@v0.8/io/readers.ts';
import { createAugmentedRequest as createAugmentedRouterRequest } from './reno/router.ts';

// TODO: avoid any
interface StubCall<TReturn, TArgs extends any[]> {
  args: TArgs;
  returnValue: TReturn;
}

export interface Stub<TReturn, TArgs extends any[]> {
  fn: (...args: TArgs) => TReturn;
  calls: StubCall<TReturn, TArgs>[];
  returnValue: TReturn;
  assertWasCalledWith(expectedCalls: TArgs[]): void;
}

/* TODO: add functionality
 * as it's required. */
export const createStub = <TReturn, TArgs extends any[]>() => {
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

    set returnValue(val: TReturn) {
      returnValue = val;
    },

    assertWasCalledWith: (expectedCalls: TArgs[]) =>
      assertEquals(expectedCalls, calls.map(({ args }) => args)),

    assertWasCalled: () => calls.length > 0,
    assertWasNotCalled: () => calls.length === 0,
  };
};

interface CreateServerRequestOptions {
  path: string;
  method?: string;
  headers?: Headers;
  body?: string;
}

export const createServerRequest = async ({
  path,
  method = 'GET',
  headers = new Headers(),
  body = '',
}: CreateServerRequestOptions) => {
  const request = `${method} ${path} HTTP/1.1
${[...headers.entries()].reduce(
  (acc, [name, val]) => `${acc}\n${name}: ${val}`,
  '',
)}

${body}
`;

  const bufReader = BufReader.create(new StringReader(request));

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return (await readRequest(bufReader)) as ServerRequest;
};

/* Helper to create router-compatible
 * request from raw options */
export const createAugmentedRequest = async ({
  path,
  method = 'GET',
  headers = new Headers(),
  body = '',
  queryParams = new URLSearchParams(),
  routeParams = [] as string[], // TODO: avoid type assertion with opts interface
}) => {
  /* We have to explicitly destruture methods
   * here as they aren't enumerable by default.
   * This is bad as we're doing it in multiple
   * places and are aware of implementation
   * details. Instead, we should write an
   * abstraction that hides this. TODO: abstract! */
  const {
    body: sBody,
    bodyStream,
    respond,
    ...rest
  } = await createServerRequest({
    path,
    method,
    headers,
    body,
  });

  return createAugmentedRouterRequest(
    { body: sBody, bodyStream, respond, ...rest },
    queryParams,
    routeParams,
  );
};
