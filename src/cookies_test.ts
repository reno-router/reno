import { test } from 'https://deno.land/std@v0.7/testing/mod.ts';

import {
  assertEquals,
  assertStrictEq,
} from 'https://deno.land/std@v0.7/testing/asserts.ts';

import { createCookieWriter } from './cookies.ts';
import { createStub } from '../test_utils.ts';

test({
  name: 'writeCookies should do nothing if there are no cookies to set',
  fn() {
    const res = {
      body: new Uint8Array(0),
    };

    const cookieSetter = createStub();
    const writeCookies = createCookieWriter(cookieSetter.fn);

    writeCookies(res);

    cookieSetter.assertWasNotCalled();
  }
});

test({
  name: 'writeCookies should use Deno`s setCookie binding to set each cookie against the response when the map is present',
  fn() {
    const res = {
      cookies: new Map([
        ['X-Foo', 'bar'],
        ['X-Bar', 'baz'],
      ]),
      body: new Uint8Array(0),
    };

    const cookieSetter = createStub();
    const writeCookies = createCookieWriter(cookieSetter.fn);

    writeCookies(res);

    cookieSetter.assertWasCalledWith([
      [res, { name: 'X-Foo', value: 'bar' }],
      [res, { name: 'X-Bar', value: 'baz' }],
    ]);
  }
});
