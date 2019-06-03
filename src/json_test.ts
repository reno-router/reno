import { test } from 'https://deno.land/std@v0.7/testing/mod.ts';

import {
  assertEquals,
} from 'https://deno.land/std@v0.7/testing/asserts.ts';

import { Response } from 'https://deno.land/std@v0.7/http/server.ts';

import { JsonRequest, jsonResponse, withJsonBody } from './json.ts';
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
  name:
    'jsonResponse accepts custom headers',
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
  name: 'withJsonBody should return a higher-order route handler that parses req.body into JS object',
  async fn() {
    interface Body {
      foo: string,
      bar: number,
      baz: boolean,
    };

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
    };

    const rawRequest = {
      ...baseRequest,
      body: () => Promise.resolve(
        new TextEncoder().encode(serialisedBody),
      ),
    };

    const augmentedRequest = {
      ...baseRequest,
      body: parsedBody,
    };

    const actualResponse = await augmentedHandler(rawRequest);

    assertEquals(actualResponse, expectedResponse);

    handlerStub.assertWasCalledWith([
      [augmentedRequest],
    ]);
  }
})
