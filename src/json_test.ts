import { test } from 'https://deno.land/std@v0.7/testing/mod.ts';

import {
  assertEquals,
} from 'https://deno.land/std@v0.7/testing/asserts.ts';

import { jsonResponse } from './json.ts';

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