import { test } from "https://deno.land/std@v0.8/testing/mod.ts";

import {
  assertEquals,
  assertStrictEq
} from "https://deno.land/std@v0.8/testing/asserts.ts";

import { Response } from "https://deno.land/std@v0.8/http/server.ts";
import {
  JsonRequest,
  FormRequest,
  jsonResponse,
  withJsonBody,
  withFormBody
} from "./helpers.ts";
import { createStub, createAugmentedRequest } from "../test_utils.ts";

test({
  name:
    "jsonResponse builds an response object with the correct Content-Type header and an encoded body",
  fn() {
    const body = {
      foo: "bar",
      bar: 1
    };

    const expectedBody = new TextEncoder().encode(JSON.stringify(body));

    const expectedHeaders = new Headers({
      "Content-Type": "application/json"
    });

    const actualResponse = jsonResponse(body);

    assertEquals(actualResponse.body, expectedBody);

    /* assertEquals doesn't currently deeply
     * compare HeaderInit objects, although
     * this could be due to the nature
     * of that object, so my workaround is: */
    assertEquals(
      [...actualResponse.headers.entries()],
      [...expectedHeaders.entries()]
    );
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

    const expectedHeaders = new Headers({
      "X-Foo": "bar",
      "X-Bar": "baz",
      "Content-Type": "application/json"
    });

    const actualResponse = jsonResponse(body, headers);

    assertEquals(
      [...actualResponse.headers.entries()],
      [...expectedHeaders.entries()]
    );
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
    const handlerStub = createStub<Response, [JsonRequest<Body>]>();
    const augmentedHandler = withJsonBody<Body>(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    handlerStub.returnValue = expectedResponse;

    const request = await createAugmentedRequest({
      path: "/",
      body: serialisedBody
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.calls[0].args;

    assertEquals(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, parsedBody);
  }
});

test({
  name:
    "withJsonBody should silently delegate to the wrapped handler if there`s no request body",
  async fn() {
    const handlerStub = createStub<Response, [JsonRequest<{}>]>();
    const augmentedHandler = withJsonBody<{}>(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    handlerStub.returnValue = expectedResponse;

    const request = await createAugmentedRequest({
      path: "/"
    });

    const parsedRequest: JsonRequest = {
      ...request,
      body: {}
    };

    const actualResponse = await augmentedHandler(request);

    assertEquals(actualResponse, expectedResponse);

    handlerStub.assertWasCalledWith([[parsedRequest]]);
  }
});

test({
  name: "withJsonBody should reject if the body can`t be parsed",
  async fn() {
    const handlerStub = createStub<Response, [JsonRequest<{}>]>();
    const augmentedHandler = withJsonBody<{}>(handlerStub.fn);
    const body = "{ not json rofl";

    const request = await createAugmentedRequest({
      path: "/",
      body
    });

    await augmentedHandler(request).catch(e => {
      handlerStub.assertWasNotCalled();
      assertStrictEq(e instanceof SyntaxError, true);
      assertStrictEq(e.message, "Unexpected token n in JSON at position 2");
    });
  }
});

test({
  name: "withFormBody should parse form data and expose the values as a Map",
  async fn() {
    const handlerStub = createStub<Response, [FormRequest]>();
    const augmentedHandler = withFormBody(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const body = "foo=bar&bar=baz&baz=rofl";
    const expectedBody = new URLSearchParams(body);

    handlerStub.returnValue = expectedResponse;

    const request = await createAugmentedRequest({
      path: "/",
      body
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.calls[0].args;

    assertEquals(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, expectedBody);
  }
});

test({
  name: "withFormBody should silently delegate to the wrapped handler if there's no req body",
  async fn() {
    const handlerStub = createStub<Response, [FormRequest]>();
    const augmentedHandler = withFormBody(handlerStub.fn);

    const expectedResponse = {
      headers: new Headers(),
      body: new Uint8Array(0)
    };

    const expectedBody = new URLSearchParams();

    handlerStub.returnValue = expectedResponse;

    const request = await createAugmentedRequest({
      path: "/",
    });

    const actualResponse = await augmentedHandler(request);
    const [actualRequest] = handlerStub.calls[0].args;

    assertEquals(actualResponse, expectedResponse);
    assertEquals(actualRequest.body, expectedBody);
  }
});
