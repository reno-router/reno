/* Makes trailing slash option if
 * at end of path segment array */
const getWildcard = (i: number, length: number) =>
  i === length - 1 ? "?(.*)" : "(.*)";

const parsePath = (path: string | RegExp) =>
  path instanceof RegExp ? path : new RegExp(
    `^${
      path
        .split("/")
        .map((part, i, { length }) =>
          part === "*" ? getWildcard(i, length) : part
        )
        .join("/")
    }/?$`,
  );

export default parsePath;
