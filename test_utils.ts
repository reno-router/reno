import { createAugmentedRequest as createAugmentedRouterRequest } from "./reno/router.ts";

function createStubAddr() {
  return {
    transport: "tcp",
    hostname: "",
    port: 0,
  } as const;
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
    body,
  }: CreateServerRequestOptions,
) {
  return new Request(`http://host${path}`, {
    method,
    headers,
    body,
  });
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
    path,
    queryParams,
    routeParams,
  );
}
