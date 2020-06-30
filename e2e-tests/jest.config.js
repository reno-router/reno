"use strict";

module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testEnvironment: "node",
  testRegex: "tests/.*.test.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  testTimeout: 15000, // Needed due to Deno's cold boot time
  globalSetup: "./test-setup.ts",
  globalTeardown: "./test-teardown.ts",
  globals: {
    "ts-jest": {
      tsConfig: "./tsconfig.json",
      diagnostics: false,
    },
  },
};
