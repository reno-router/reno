import { setCookie } from "https://deno.land/std@v0.51.0/http/cookie.ts";
import { AugmentedResponse } from "./router.ts";

/* Currently, setCookie will overwrite
 * any current Set-Cookie instances in
 * the responses headers. This is due to
 * the Headers API not supporting multiple
 * entries of a single header type. Rather
 * than work around this here, we should
 * wait for a workaround to land in Deno.
 * See github.com/denoland/deno_std/issues/379
 *
 * TODO: keep an eye on the above issue to see
 * if and when a fix will land in Deno. Raise
 * this as known in this repo's GitHub issues */
export const createCookieWriter = (cookieSetter: typeof setCookie) =>
  (
    res: AugmentedResponse,
  ) => {
    if (!res.cookies) {
      return;
    }

    [...res.cookies.entries()].forEach(([name, value]) => {
      cookieSetter(res, { name, value });
    });
  };

export const writeCookies = createCookieWriter(setCookie);
