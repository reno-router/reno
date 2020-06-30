# Reno End-To-End Tests

**TODO: write a Supertest-like E2E testing util for Reno apps and use it in lieu of Node.js and Frisby**

This end-to-end test suite requests the example app's endpoints via [Frisby](https://github.com/vlucas/frisby). As there aren't any HTTP testing tools that can run in Deno at the time of writing (I'm entertaining rolling my own...), this is built in Node.js; that said, it at least uses the same TypeScript version used by the Deno version specified in the root directory's `.deno-version` file.

To run the suite:

```sh
# If you don't already have nvm installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

nvm i
npm i
npm test
```
