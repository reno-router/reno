import { setCookie } from "../deps.ts";
import { AugmentedResponse } from "./router.ts";

function hasSetCookie(headers: Headers, name: string) {
  return [...headers.entries()]
    .some(([header, value]) =>
      header.toLowerCase() === "set-cookie" &&
      value.match(new RegExp(`^${name}=`))
    );
}

export function writeCookies(
  res: Pick<AugmentedResponse, "cookies" | "headers">,
) {
  if (!res.cookies) {
    return;
  }

  res.cookies.forEach(([name, value]) => {
    if (!hasSetCookie(res.headers, name)) {
      setCookie(res.headers, { name, value });
    }
  });
}
