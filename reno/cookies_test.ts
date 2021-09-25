import { writeCookies } from "./cookies.ts";
import { testdouble, assertEquals, setCookie } from "../deps.ts";

Deno.test({
  name: "writeCookies should do nothing if there are no cookies to set",
  fn() {
    const res = {
      headers: new Headers(),
    };

    writeCookies(res);

    assertEquals(res.headers, new Headers())
  },
});

Deno.test({
  name:
    "writeCookies should use Deno`s setCookie binding to set each cookie against the response when the map is present",
  fn() {
    const res = {
      cookies: [["X-Foo", "bar"], ["X-Bar", "baz"]] as [string, string][],
      headers: new Headers(),
    };

    writeCookies(res);

    const expectedHeaders = new Headers([
      ['Set-Cookie', 'X-Foo=bar'],
      ['Set-Cookie', 'X-Bar=baz'],
    ]);

    assertEquals(res.headers, expectedHeaders);
  },
});

Deno.test({
  name:
    "writeCookies should not overwrite a cookie if it's already present in the response header",
  fn() {
    const res = {
      cookies: [["X-Foo", "bar"], ["X-Bar", "baz"], ["X-Foo", "baz"]] as [string, string][],
      headers: new Headers()
    };

    writeCookies(res);

    const expectedHeaders = new Headers([
      ['Set-Cookie', 'X-Foo=bar'],
      ['Set-Cookie', 'X-Bar=baz'],
    ]);

    assertEquals(res.headers, expectedHeaders);
  },
});
