/* If we've reached the last wildcard of the
 * path, then we can greedily capture everything.
 * For everything else we have to limit the matching
 * characters to avoid greedy capturing for inner
 * segments. This might bite us on the backside
 * down the road so we should perhaps perform a
 * negative lookahead for '/' instead.
 *
 * TODO: address the above! */
function getWildcard(i: number, length: number) {
  return i === length - 1 ? "?(.*)" : "([a-zA-Z0-9-_,.]*)";
}

function parsePath(path: string | RegExp) {
  return path instanceof RegExp ? path : new RegExp(
    `^${
      path
        .split("/")
        .map((part, i, { length }) =>
          part === "*" ? getWildcard(i, length) : part
        )
        .join("/")
    }/?$`,
  );
}

export default parsePath;
