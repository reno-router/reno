import { assertStrictEquals, sinon } from "../deps.ts";

import {
  jsonResponse,
  ProcessedRequest,
  withFormBody,
  withJsonBody,
} from "./builtins.ts";

import { assertResponsesAreEqual } from "./testing.ts";
import { createAugmentedRequest } from "../test_utils.ts";
import { AugmentedRequest, RouteHandler } from "./router.ts";

function createHandlerStub<TBody>(
  _: AugmentedRequest,
  expectedResponse?: Response,
) {
  return sinon.stub().returns(expectedResponse) as RouteHandler<
    ProcessedRequest<TBody>
  >;
}

Deno.test({
  name:
    "jsonResponse builds an response object with the correct Content-Type header and an encoded body",
  async fn() {
    const body = {
      foo: "bar",
      bar: 1,
    };

    const expectedResponse = new Response(JSON.stringify(body), {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    });

    const actualResponse = jsonResponse(body);

    await assertResponsesAreEqual(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "jsonResponse allows a custom HTTP status to be set",
  async fn() {
    const body = {
      foo: "bar",
      bar: 1,
    };

    const expectedResponse = new Response(JSON.stringify(body), {
      status: 201,
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    });

    const actualResponse = jsonResponse(body, {}, 201);

    await assertResponsesAreEqual(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "jsonResponse accepts custom headers",
  async fn() {
    const body = {
      foo: "bar",
      bar: 1,
    };

    const headers = {
      "X-Foo": "bar",
      "X-Bar": "baz",
    };

    const expectedResponse = new Response(JSON.stringify(body), {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/json",
        "X-Foo": "bar",
        "X-Bar": "baz",
      }),
    });

    const actualResponse = jsonResponse(body, headers);

    await assertResponsesAreEqual(actualResponse, expectedResponse);
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

    const request = await createAugmentedRequest({
      path: "/",
      method: "POST",
      body: serialisedBody,
    });

    const expectedResponse = new Response();

    const handlerStub = createHandlerStub<Body>(request, expectedResponse);
    const augmentedHandler = withJsonBody<Body>(handlerStub);

    const actualResponse = await augmentedHandler(request);

    await assertResponsesAreEqual(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "withJsonBody should reject if there`s no request body",
  async fn() {
    const expectedResponse = new Response();

    const request = await createAugmentedRequest({
      path: "/",
      method: "POST",
    });

    const handlerStub = createHandlerStub(request, expectedResponse);
    const augmentedHandler = withJsonBody(handlerStub);

    // TODO: use assertThrowsAsync
    await augmentedHandler(request).catch((e) => {
      assertStrictEquals(e instanceof Error, true);
      assertStrictEquals(e.message, "Content-Length header was not set!");
    });
  },
});

Deno.test({
  name: "withJsonBody should reject if the body can't be parsed",
  async fn() {
    const body = "{ not json rofl";

    const request = await createAugmentedRequest({
      path: "/",
      method: "POST",
      body,
    });

    const handlerStub = createHandlerStub(request);
    const augmentedHandler = withJsonBody(handlerStub);

    await augmentedHandler(request).catch((e) => {
      assertStrictEquals(e instanceof SyntaxError, true);
      assertStrictEquals(
        e.message,
        "Expected property name or '}' in JSON at position 2",
      );
    });
  },
});

Deno.test({
  name: "withFormBody should parse form data and expose the values as a Map",
  async fn() {
    const expectedResponse = new Response();
    const body = "foo=bar&bar=baz&baz=rofl";

    const request = await createAugmentedRequest({
      path: "/",
      method: "POST",
      body,
    });

    const handlerStub = createHandlerStub(request, expectedResponse);
    const augmentedHandler = withFormBody(handlerStub);

    const actualResponse = await augmentedHandler(request);

    await assertResponsesAreEqual(actualResponse, expectedResponse);
  },
});

Deno.test({
  name: "withFormBody reject if there's no req body",
  async fn() {
    const expectedResponse = new Response();

    const request = await createAugmentedRequest({
      path: "/",
      method: "POST",
    });

    const handlerStub = createHandlerStub(request, expectedResponse);

    const augmentedHandler = withFormBody(handlerStub);

    // TODO: use assertThrowsAsync
    await augmentedHandler(request).catch((e) => {
      assertStrictEquals(e instanceof Error, true);
      assertStrictEquals(e.message, "Content-Length header was not set!");
    });
  },
});
