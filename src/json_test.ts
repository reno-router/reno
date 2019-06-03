import { test } from 'https://deno.land/std@v0.7/testing/mod.ts';

import {
  assertEquals,
  assertStrictEq,
} from 'https://deno.land/std@v0.7/testing/asserts.ts';

import {
  Response,
  ServerRequest,
} from 'https://deno.land/std@v0.7/http/server.ts';
import { JsonRequest, jsonResponse, withJsonBody } from './json.ts';
import { AugmentedRequest } from './router.ts';
import { createStub } from '../test_utils.ts';

test({
  name:
    'jsonResponse builds an response object with the correct Content-Type header and an encoded body',
  fn() {
    const body = {
      foo: 'bar',
      bar: 1,
    };

    const expectedBody = new TextEncoder().encode(JSON.stringify(body));

    const expectedHeaders = new Headers({
      'Content-Type': 'application/json',
    });

    const actualResponse = jsonResponse(body);

    assertEquals(actualResponse.body, expectedBody);

    /* assertEquals doesn't currently deeply
     * compare HeaderInit objects, although
     * this could be due to the nature
     * of that object, so my workaround is: */
    assertEquals(
      [...actualResponse.headers.entries()],
      [...expectedHeaders.entries()],
    );
  },
});

test({
  name: 'jsonResponse accepts custom headers',
  fn() {
    const body = {
      foo: 'bar',
      bar: 1,
    };

    const headers = {
      'X-Foo': 'bar',
      'X-Bar': 'baz',
    };

    const expectedHeaders = new Headers({
      'X-Foo': 'bar',
      'X-Bar': 'baz',
      'Content-Type': 'application/json',
    });

    const actualResponse = jsonResponse(body, headers);

    assertEquals(
      [...actualResponse.headers.entries()],
      [...expectedHeaders.entries()],
    );
  },
});

test({
  name:
    'withJsonBody should return a higher-order route handler that parses req.body into JS object',
  async fn() {
    interface Body {
      foo: string;
      bar: number;
      baz: boolean;
    }

    const parsedBody = {
      foo: 'bar',
      bar: 42,
      baz: true,
    };

    const serialisedBody = JSON.stringify(parsedBody);
    const handlerStub = createStub<Response, [JsonRequest<Body>]>();
    const augmentedHandler = withJsonBody<Body>(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    handlerStub.returnValue = expectedResponse;

    const baseRequest = {
      url: '/',
      method: 'GET',
      headers: new Headers(),
      queryParams: new URLSearchParams(),
      routeParams: [],
      respond: undefined, // TODO: omit!
      bodyStream: undefined, // TODO: omit!
    };

    const rawRequest = {
      ...baseRequest,
      body: () => Promise.resolve(new TextEncoder().encode(serialisedBody)),
    };

    const augmentedRequest = {
      ...baseRequest,
      body: parsedBody,
    };

    // TODO: use createServerRequest helper!
    const actualResponse = await augmentedHandler(
      (rawRequest as unknown) as AugmentedRequest,
    );

    assertEquals(actualResponse, expectedResponse);

    handlerStub.assertWasCalledWith([
      [(augmentedRequest as unknown) as JsonRequest<Body>],
    ]);
  },
});

test({
  name:
    'withJsonBody should silently delegate to the wrapped handler if there`s no request body',
  async fn() {
    const handlerStub = createStub<Response, [JsonRequest<{}>]>();
    const augmentedHandler = withJsonBody<{}>(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    handlerStub.returnValue = expectedResponse;

    const baseRequest = {
      url: '/',
      method: 'GET',
      headers: new Headers(),
      queryParams: new URLSearchParams(),
      routeParams: [],
      respond: undefined, // TODO: omit!
      bodyStream: undefined, // TODO: omit!
    };

    const request = {
      ...baseRequest,
      body: () => Promise.resolve(new Uint8Array(0)),
    };

    const augmentedRequest = {
      ...baseRequest,
      body: {}, // Default when no body is provided
    };

    // TODO: use createServerRequest helper!
    const actualResponse = await augmentedHandler(
      (request as unknown) as AugmentedRequest,
    );

    assertEquals(actualResponse, expectedResponse);

    handlerStub.assertWasCalledWith([
      [(augmentedRequest as unknown) as JsonRequest<{}>],
    ]);
  },
});

test({
  name: 'withJsonBody should reject if the body can`t be parsed',
  async fn() {
    const handlerStub = createStub<Response, [JsonRequest<{}>]>();
    const augmentedHandler = withJsonBody<{}>(handlerStub.fn);
    const serialisedBody = '{ not json rofl';

    const baseRequest = {
      url: '/',
      method: 'GET',
      headers: new Headers(),
      queryParams: new URLSearchParams(),
      routeParams: [],
    };

    const rawRequest = {
      ...baseRequest,
      body: () => Promise.resolve(new TextEncoder().encode(serialisedBody)),
    };

    // TODO: use createServerRequest helper!
    await augmentedHandler((rawRequest as unknown) as AugmentedRequest).catch(
      e => {
        handlerStub.assertWasNotCalled();
        assertStrictEq(e instanceof SyntaxError, true);
        assertStrictEq(e.message, 'Unexpected token n in JSON at position 2');
      },
    );
  },
});
