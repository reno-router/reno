import { assertEquals, assertStrictEq } from "https://deno.land/std@v0.20.0/testing/asserts.ts";
import { BufReader } from "https://deno.land/std@v0.20.0/io/bufio.ts";
import {
  readRequest,
  ServerRequest
} from "https://deno.land/std@v0.20.0/http/server.ts";
import { StringReader } from "https://deno.land/std@v0.20.0/io/readers.ts";
import { createAugmentedRequest as createAugmentedRouterRequest } from "./reno/router.ts";

// TODO: avoid any
interface StubCall<TReturn, TArgs = any[]> {
  args: TArgs;
  returnValue: TReturn;
}

class StubConn implements Deno.Conn {
  constructor() {
    this.localAddr = "";
    this.remoteAddr = "";
    this.rid = 1;
  }

  localAddr: string;
  remoteAddr: string;
  rid: number;

  closeRead(): void {}
  closeWrite(): void {}
  close(): void {}

  read(p: Uint8Array): Promise<number> {
    return Promise.resolve(p.length);
  }

  write(p: Uint8Array): Promise<number> {
    return Promise.resolve(p.length);
  }
}

export interface Stub<TReturn, TArgs extends any[] = any[]> {
  fn: (...args: TArgs) => TReturn;
  calls: StubCall<TReturn, TArgs>[];
  returnValue: TReturn;
  assertWasCalledWith(expectedCalls: TArgs[]): void;
  assertWasCalled(): void;
  assertWasNotCalled(): void;
}

/* TODO: add functionality
 * as it's required. */
export const createStub = <TReturn, TArgs extends any[] = any[]>() => {
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

    assertWasCalled: () => assertStrictEq(calls.length > 0, true),
    assertWasNotCalled: () => assertStrictEq(calls.length > 0, false)
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
  method = "GET",
  headers = new Headers(),
  body = ""
}: CreateServerRequestOptions) => {
  const request = `${method} ${path} HTTP/1.1
Content-Length: ${body.length}
${[...headers.entries()].reduce(
  (acc, [name, val]) => `${acc}\n${name}: ${val}`,
  ""
)}
${body}`;

  const bufReader = BufReader.create(new StringReader(request));

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return (await readRequest(new StubConn(), bufReader)) as ServerRequest;
};

/* Helper to create router-compatible
 * request from raw options */
export const createAugmentedRequest = async ({
  path,
  method = "GET",
  headers = new Headers(),
  body = "",
  queryParams = new URLSearchParams(),
  routeParams = [] as string[] // TODO: avoid type assertion with opts interface
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
    body
  });

  return createAugmentedRouterRequest(
    { body: sBody, bodyStream, respond, ...rest },
    queryParams,
    routeParams
  );
};
