import { assertEquals } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

export const assertResponsesMatch = (
  actual: AugmentedResponse,
  expected: AugmentedResponse,
) => {
  assertEquals(
    ...([actual, expected].map((res) => ({
      // body: res.body,
      // headers: res.headers && new Map(res.headers) // So that headers are deeply compared
    })) as [unknown, unknown]),
  );
};
