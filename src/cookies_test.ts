import { test } from 'https://deno.land/std@v0.5/testing/mod.ts';
import { assertStrictEq } from 'https://deno.land/std@v0.5/testing/asserts.ts';
import { serialiseCookies } from './cookies.ts';

test({
  name: 'It should return an empty string when the provided map is empty',
  fn() {
    const cookies = new Map<string, string>();
    const serialisedCookies = serialiseCookies(cookies);

    assertStrictEq(serialisedCookies, '');
  }
});
