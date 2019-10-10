import { test } from "https://deno.land/std@v0.20.0/testing/mod.ts";
import {
  assertStrictEq,
  assertMatch,
} from "https://deno.land/std@v0.20.0/testing/asserts.ts";
import parsePath from "./pathparser.ts";

const assertNotMatch = (actual: string, regExp: RegExp) => {
  assertStrictEq(
    regExp.test(actual),
    false,
    `actual: "${actual}" expected not to match: "${regExp}"`
  );
};

test({
  name: "parsePath should convert a human-friendly path spec into a RegExp",
  async fn() {
    const path = "/api/foo/*/bar";
    const regExp = parsePath(path);

    assertMatch("/api/foo/lol/bar", regExp);
    assertMatch("/api/foo/lol/bar/", regExp);
    assertNotMatch("/api/foo/lol", regExp);
    assertStrictEq('rofl', '/api/foo/rofl/bar'.match(regExp)[1]);
  }
});

test({
  name: "parsePath should treat the last wildcard as optional",
  async fn() {
    const path = "/api/foo/*";
    const regExp = parsePath(path);

    assertMatch("/api/foo/lol", regExp);
    assertMatch("/api/foo/", regExp);
    assertMatch("/api/foo", regExp);
    assertMatch("/api/foo/lol/rofl", regExp);
  }
});
