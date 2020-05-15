import { BufReader } from "https://deno.land/std@v0.51.0/io/bufio.ts";
import {
  readRequest,
  ServerRequest
} from "https://deno.land/std@v0.51.0/http/server.ts";
import { StringReader } from "https://deno.land/std@v0.51.0/io/readers.ts";
import { createAugmentedRequest as createAugmentedRouterRequest } from "./reno/router.ts";

const createStubAddr = (): Deno.Addr => ({
  transport: 'tcp',
  hostname: '',
  port: 0,
});

const createStubConn = (): Deno.Conn => ({
  localAddr: createStubAddr(),
  remoteAddr: createStubAddr(),
  rid: 1,
  closeRead: () => undefined,
  closeWrite: () => undefined,
  close: () => undefined,
  read: (p: Uint8Array) => Promise.resolve(p.length),
  write: (p: Uint8Array) => Promise.resolve(p.length),
});

interface CreateServerRequestOptions {
  path: string;
  method?: string;
  headers?: Headers;
  body?: string;
}

export const createServerRequest = async ({
  path,
  method = "GET",
  headers = new Headers(),
  body = ""
}: CreateServerRequestOptions) => {
  const request = `${method} ${path} HTTP/1.1
Content-Length: ${body.length}
${[...headers.entries()].reduce(
  (acc, [name, val]) => `${acc}\n${name}: ${val}`,
  ""
)}
${body}`;

  const bufReader = BufReader.create(new StringReader(request));

  /* readRequest can also return EOF,
   * thus we need to type assert here */
  return (await readRequest(createStubConn(), bufReader)) as ServerRequest;
};

/* Helper to create router-compatible
 * request from raw options */
export const createAugmentedRequest = async ({
  path,
  method = "GET",
  headers = new Headers(),
  body = "",
  queryParams = new URLSearchParams(),
  routeParams = [] as string[] // TODO: avoid type assertion with opts interface
}) => {
  /* We have to explicitly destruture methods
   * here as they aren't enumerable by default.
   * This is bad as we're doing it in multiple
   * places and are aware of implementation
   * details. Instead, we should write an
   * abstraction that hides this. TODO: abstract! */
  const {
    body: sBody,
,
    respond,
    ...rest
  } = await createServerRequest({
    path,
    method,
    headers,
    body
  });

  return createAugmentedRouterRequest(
    { body: sBody, respond, ...rest },
    queryParams,
    routeParams
  );
};
