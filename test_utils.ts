import { BufReader } from "https://deno.land/std@0.105.0/io/bufio.ts";
import {
  ServerRequest,
} from "https://deno.land/std@0.105.0/http/server.ts";
import { StringReader } from "https://deno.land/std@0.105.0/io/readers.ts";
import { readRequest } from "https://deno.land/std@0.105.0/http/_io.ts";
import { createAugmentedRequest as createAugmentedRouterRequest } from "./reno/router.ts";

function createStubAddr() {
  return {
    transport: "tcp",
    hostname: "",
    port: 0,
  } as const;
}

function createStubConn() {
  return {
    localAddr: createStubAddr(),
    remoteAddr: createStubAddr(),
    rid: 1,
    closeWrite: () => Promise.resolve(undefined),
    close: () => undefined,
    read: (p: Uint8Array) => Promise.resolve(p.length),
    write: (p: Uint8Array) => Promise.resolve(p.length),
  };
}

interface CreateServerRequestOptions {
  path: string;
  method?: string;
  headers?: Headers;
  body?: string;
}

export async function createServerRequest(
  {
    path,
    method = "GET",
    headers = new Headers(),
    body = "",
  }: CreateServerRequestOptions,
) {
  const request = `${method} ${path} HTTP/1.1
Content-Length: ${body.length}
${[...headers.entries()].reduce(
    (acc, [name, val]) => `${acc}\n${name}: ${val}`,
    "",
  )
    }
${body}`;

  const bufReader = BufReader.create(new StringReader(request));

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return (await readRequest(createStubConn(), bufReader)) as ServerRequest;
}

/* Helper to create router-compatible
 * request from raw options */
export async function createAugmentedRequest(
  {
    path = "/",
    method = "GET",
    headers = new Headers(),
    body = "",
    queryParams = new URLSearchParams(),
    routeParams = [] as string[], // TODO: avoid type assertion with opts interface
  },
) {
  const req = await createServerRequest({
    path,
    method,
    headers,
    body,
  });

  return createAugmentedRouterRequest(
    req,
    queryParams,
    routeParams,
  );
}
