import { setCookie } from 'https://deno.land/std@v0.7/http/cookie.ts';
import { AugmentedResponse } from './router.ts';

export const createCookieWriter = (cookieSetter: typeof setCookie) =>
  (res: AugmentedResponse) => {
    if (!res.cookies) {
      return;
    }

    [...res.cookies.entries()].forEach(([name, value]) => {
      cookieSetter(res, { name, value });
    })
  };

export const writeCookies = createCookieWriter(setCookie);
