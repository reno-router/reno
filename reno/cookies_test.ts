import { createCookieWriter } from "./cookies.ts";
import { sinon } from "../deps.ts";

Deno.test({
  name: "writeCookies should do nothing if there are no cookies to set",
  fn() {
    const res = {
      body: new Uint8Array(0),
    };

    const cookieSetter = sinon.stub();
    const writeCookies = createCookieWriter(cookieSetter);

    writeCookies(res);

    sinon.assert.notCalled(cookieSetter);
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

    const cookieSetter = sinon.stub();
    const writeCookies = createCookieWriter(cookieSetter);

    writeCookies(res);

    sinon.assert.calledTwice(cookieSetter);
    sinon.assert.calledWithExactly(cookieSetter, res, {
      name: "X-Foo",
      value: "bar",
    });
    sinon.assert.calledWithExactly(cookieSetter, res, {
      name: "X-Bar",
      value: "baz",
    });
  },
});
