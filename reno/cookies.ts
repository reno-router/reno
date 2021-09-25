import { setCookie } from '../deps.ts';
import { AugmentedResponse } from "./router.ts";

export function writeCookies(res: Pick<AugmentedResponse, 'cookies' | 'headers'>) {
  if (!res.cookies) {
    return;
  }

  [...res.cookies.entries()].forEach(([name, value]) => {
    setCookie(res.headers, { name, value });
  });
}
