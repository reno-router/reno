function getWildcard(i: number, length: number) {
  return i === length - 1 ? "?(.*)" : "(.*)";
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
