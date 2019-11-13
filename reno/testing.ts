import {
  assertEquals
} from "https://deno.land/std@v0.23.0/testing/asserts.ts";

import { AugmentedResponse } from './router.ts';

const decoder = new TextDecoder();

const bodyToString = (body: Uint8Array | Deno.Reader): string =>
  body instanceof Uint8Array
    ? decoder.decode(body)
    : Deno.inspect(body);

export const assertResponsesMatch = (actual: AugmentedResponse, expected: AugmentedResponse) => {
  assertEquals(...[actual, expected].map(res => ({
    ...res,
    body: res.body && bodyToString(res.body),
    headers: new Map(res.headers), // So that headers are deeply compared
  })) as [unknown, unknown]);
};
