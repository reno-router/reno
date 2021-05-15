import { setCookie } from "https://deno.land/std@0.96.0/http/cookie.ts";
import { AugmentedResponse } from "./router.ts";

/* This abstraction was built when Deno only allowed unique header
 * names to be set against a given response, but this has since
 * been rectified to support multiple instances of `Set-Cookie`.
 * Given Reno's nested router architecture, we thus need to check
 * if a cookie name with a matching incoming value already exists
 * in the header. Ultimately, this whole function wants scrapping.
 *
 * TODO: refactor! */
export function createCookieWriter(cookieSetter: typeof setCookie) {
  return (
    res: AugmentedResponse,
  ) => {
    if (!res.cookies) {
      return;
    }

    [...res.cookies.entries()].forEach(([name, value]) => {
      if (res.headers?.get("Set-Cookie")?.includes(`${name}=${value}`)) {
        return;
      }

      cookieSetter(res, { name, value });
    });
  };
}

export const writeCookies = createCookieWriter(setCookie);
