export const serialiseCookies = (cookies: Map<string, string>) =>
  [...cookies.entries()].reduce(
    (cookieString, [key, value]) => '',
    '',
  );
