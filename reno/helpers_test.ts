import { test } from "https://deno.land/std@v0.23.0/testing/mod.ts";

import { sinon, assertEquals, assertStrictEq } from "../deps.ts";

import {
  JsonRequest,
  FormRequest,
  jsonResponse,
  textResponse,
  withJsonBody,
  withFormBody
} from "./helpers.ts";

import { assertResponsesMatch } from "./testing.ts";
import { createAugmentedRequest } from "../test_utils.ts";

test({
  name:
    "jsonResponse builds an response object with the correct Content-Type header and an encoded body",
  fn() {
    const body = {
      foo: "bar",
      bar: 1
    };

    const expectedResponse = {
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: new TextEncoder().encode(JSON.stringify(body))
    };

    const actualResponse = jsonResponse(body);

    assertResponsesMatch(actualResponse, expectedResponse);
  }
});

test({
  name: "jsonResponse accepts custom headers",
  fn() {
    const body = {
      foo: "bar",
      bar: 1
    };

    const headers = {
      "X-Foo": "bar",
      "X-Bar": "baz"
    };

    const expectedResponse = {
      headers: new Headers({
        "X-Foo": "bar",
        "X-Bar": "baz",
        "Content-Type": "application/json"
      }),
      body: new TextEncoder().encode(JSON.stringify(body))
    };

    const actualResponse = jsonResponse(body, headers);

    assertResponsesMatch(actualResponse, expectedResponse);
  }
});

test({
  name:
    "textResponse builds an response object with the correct Content-Type header and an encoded body",
  fn() {
    const body = "Hello, world!";

    const expectedResponse = {
      body: new TextEncoder().encode(body),
      headers: new Headers({
        "Content-Type": "text/plain"
      })
    };

    const actualResponse = textResponse(body);

    assertResponsesMatch(actualResponse, expectedResponse);
  }
});

test({
  name: "textResponse accepts custom headers",
  fn() {
    const body = "Hello, world!";

    const headers = {
      "X-Foo": "bar",
      "X-Bar": "baz"
    };

    const expectedResponse = {
      body: new TextEncoder().encode(body),
      headers: new Headers({
        "X-Foo": "bar",
        "X-Bar": "baz",
        "Content-Type": "text/plain"
      })
    };

    const actualResponse = textResponse(body, headers);

    assertResponsesMatch(actualResponse, expectedResponse);
  }
});

test({
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
      baz: true
    };

    const serialisedBody = JSON.stringify(parsedBody);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withJsonBody<Body>(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
      body: serialisedBody
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.firstCall.args;

    assertResponsesMatch(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, parsedBody);
  }
});

test({
  name:
    "withJsonBody should silently delegate to the wrapped handler if there`s no request body",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withJsonBody<{}>(handlerStub);

    const request = await createAugmentedRequest({
      path: "/"
    });

    const parsedRequest: JsonRequest = {
      ...request,
      body: {}
    };

    const actualResponse = await augmentedHandler(request);

    assertEquals(actualResponse, expectedResponse);

    sinon.assert.calledOnce(handlerStub);
    sinon.assert.alwaysCalledWithExactly(handlerStub, parsedRequest);
  }
});

test({
  name: "withJsonBody should reject if the body can`t be parsed",
  async fn() {
    const handlerStub = sinon.stub();
    const augmentedHandler = withJsonBody<{}>(handlerStub);
    const body = "{ not json rofl";

    const request = await createAugmentedRequest({
      path: "/",
      body
    });

    await augmentedHandler(request).catch(e => {
      sinon.assert.notCalled(handlerStub);
      assertStrictEq(e instanceof SyntaxError, true);
      assertStrictEq(e.message, "Unexpected token n in JSON at position 2");
    });
  }
});

test({
  name: "withFormBody should parse form data and expose the values as a Map",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const body = "foo=bar&bar=baz&baz=rofl";
    const expectedBody = new URLSearchParams(body);
    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withFormBody(handlerStub);

    const request = await createAugmentedRequest({
      path: "/",
      body
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.firstCall.args;

    assertResponsesMatch(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, expectedBody);
  }
});

test({
  name:
    "withFormBody should silently delegate to the wrapped handler if there's no req body",
  async fn() {
    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const expectedBody = new URLSearchParams();
    const handlerStub = sinon.stub().returns(expectedResponse);
    const augmentedHandler = withFormBody(handlerStub);

    const request = await createAugmentedRequest({
      path: "/"
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.firstCall.args;

    assertResponsesMatch(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, expectedBody);
  }
});
