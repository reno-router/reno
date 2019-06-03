import { assertEquals } from 'https://deno.land/std@v0.7/testing/asserts.ts';
import { BufReader } from 'https://deno.land/std@v0.7/io/bufio.ts';
import { readRequest, ServerRequest } from 'https://deno.land/std@v0.7/http/server.ts';
import { StringReader } from 'https://deno.land/std@v0.7/io/readers.ts';

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
  };
};

interface CreateServerRequestOptions {
  path: string,
  method?: string,
  headers?: Headers,
  body?: string,
};

// TODO: body support, consume headers!
export const createServerRequest = async ({
  path,
  method = 'GET',
  headers = new Headers(),
  body = '',
}: CreateServerRequestOptions) => {
  const request = `${method} ${path} HTTP/1.1\n\n`;

  const bufReader = BufReader.create(new StringReader(request));

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return (await readRequest(bufReader)) as ServerRequest;
};