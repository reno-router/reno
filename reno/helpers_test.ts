import { sinon, assertEquals, assertStrictEq } from "../deps.ts";

import {
  JsonRequest,
  jsonResponse,
  textResponse,
  withJsonBody,
  withFormBody,
} from "./helpers.ts";

import { assertResponsesMatch } from "./testing.ts";
import { createAugmentedRequest } from "../test_utils.ts";

Deno.test({
  name:
    "jsonResponse builds an response object with the correct Content-Type header and an encoded body",
  fn() {
    const body = {
      foo: "bar",
      bar: 1,
    };

    const expectedResponse = {
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: new TextEncoder().encode(JSON.stringify(body)),
    };

    const actualResponse = jsonResponse(body);

    assertResponsesMatch(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "jsonResponse accepts custom headers",
  fn() {
    const body = {
      foo: "bar",
      bar: 1,
    };

    const headers = {
      "X-Foo": "bar",
      "X-Bar": "baz",
    };

    const expectedResponse = {
      headers: new Headers({
        "X-Foo": "bar",
        "X-Bar": "baz",
        "Content-Type": "application/json",
      }),
      body: new TextEncoder().encode(JSON.stringify(body)),
    };

    const actualResponse = jsonResponse(body, headers);

    assertResponsesMatch(actualResponse, expectedResponse);
  },
});

Deno.test({
  name:
    "textResponse builds an response object with the correct Content-Type header and an encoded body",
  fn() {
    const body = "Hello, world!";

    const expectedResponse = {
      body: new TextEncoder().encode(body),
      headers: new Headers({
        "Content-Type": "text/plain",
      }),
    };

    const actualResponse = textResponse(body);

    assertResponsesMatch(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "textResponse accepts custom headers",
  fn() {
    const body = "Hello, world!";

    const headers = {
      "X-Foo": "bar",
      "X-Bar": "baz",
    };

    const expectedResponse = {
      body: new TextEncoder().encode(body),
      headers: new Headers({
        "X-Foo": "bar",
        "X-Bar": "baz",
        "Content-Type": "text/plain",
      }),
    };

    const actualResponse = textResponse(body, headers);

    assertResponsesMatch(actualResponse, expectedResponse);
  },
});

Deno.test({
  name:
    "withJsonBody should return a higher-order route handler that parses req.body into JS object",
  async fn() {
    interface Body {
      foo: string;
      bar: number;
      baz: boolean;
    }

    const parsedBody = {
      foo: "bar",
      bar: 42,
      baz: true,
    };

    const serialisedBody = JSON.stringify(parsedBody);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withJsonBody<Body>(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
      body: serialisedBody,
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.firstCall.args;

    assertResponsesMatch(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, parsedBody);
  },
});

Deno.test({
  name: "withJsonBody reject if there`s no request body",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withJsonBody<{}>(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
    });

    // TODO: use assertThrowsAsync
    await augmentedHandler(request).catch((e) => {
      sinon.assert.notCalled(handlerStub);
      assertStrictEq(e instanceof Error, true);
      assertStrictEq(e.message, "Content-Length header was not set!");
    });
  },
});

Deno.test({
  name: "withJsonBody should reject if the body can`t be parsed",
  async fn() {
    const handlerStub = sinon.stub();
    const augmentedHandler = withJsonBody<{}>(handlerStub);
    const body = "{ not json rofl";

    const request = await createAugmentedRequest({
      path: "/",
      body,
    });

    await augmentedHandler(request).catch((e) => {
      sinon.assert.notCalled(handlerStub);
      assertStrictEq(e instanceof SyntaxError, true);
      assertStrictEq(e.message, "Unexpected token n in JSON at position 2");
    });
  },
});

Deno.test({
  name: "withFormBody should parse form data and expose the values as a Map",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    const body = "foo=bar&bar=baz&baz=rofl";
    const expectedBody = new URLSearchParams(body);
    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withFormBody(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
      body,
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.firstCall.args;

    assertResponsesMatch(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, expectedBody);
  },
});

Deno.test({
  name: "withFormBody reject if there's no req body",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0),
    };

    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withFormBody(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
    });

    // TODO: use assertThrowsAsync
    await augmentedHandler(request).catch((e) => {
      sinon.assert.notCalled(handlerStub);
      assertStrictEq(e instanceof Error, true);
      assertStrictEq(e.message, "Content-Length header was not set!");
    });
  },
});
