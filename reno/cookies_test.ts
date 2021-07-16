import { createCookieWriter } from "./cookies.ts";
import { testdouble } from "../deps.ts";
import { setCookie } from "https://deno.land/std@0.101.0/http/cookie.ts";

type CookieSetter = typeof setCookie;

Deno.test({
  name: "writeCookies should do nothing if there are no cookies to set",
  fn() {
    const res = {
      body: new Uint8Array(0),
    };

    const cookieSetter = testdouble.func();
    const writeCookies = createCookieWriter(cookieSetter as CookieSetter);

    writeCookies(res);

    testdouble.verify(cookieSetter(), {
      times: 0,
    });
  },
});

Deno.test({
  name:
    "writeCookies should use Deno`s setCookie binding to set each cookie against the response when the map is present",
  fn() {
    const res = {
      cookies: new Map([["X-Foo", "bar"], ["X-Bar", "baz"]]),
      body: new Uint8Array(0),
    };

    const cookieSetter = testdouble.func();
    const writeCookies = createCookieWriter(cookieSetter as CookieSetter);

    writeCookies(res);

    testdouble.verify(
      cookieSetter(res, {
        name: "X-Foo",
        value: "bar",
      }),
      { times: 1 },
    );

    testdouble.verify(
      cookieSetter(res, {
        name: "X-Bar",
        value: "baz",
      }),
      { times: 1 },
    );
  },
});

Deno.test({
  name:
    "writeCookies should overwrite a cookie if it's already present in the response header",
  fn() {
    const res = {
      cookies: new Map([["X-Foo", "bar"], ["X-Bar", "baz"], ["X-Foo", "baz"]]),
      body: new Uint8Array(0),
    };

    const cookieSetter = testdouble.func();
    const writeCookies = createCookieWriter(cookieSetter as CookieSetter);

    writeCookies(res);

    testdouble.verify(
      cookieSetter(res, {
        name: "X-Foo",
        value: "bar",
      }),
      { times: 0 },
    );

    testdouble.verify(
      cookieSetter(res, {
        name: "X-Bar",
        value: "baz",
      }),
      { times: 1 },
    );

    testdouble.verify(
      cookieSetter(res, {
        name: "X-Foo",
        value: "baz",
      }),
      { times: 1 },
    );
  },
});
