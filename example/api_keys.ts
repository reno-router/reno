// A stub API keys storage layer

export default function isValidAPIKey(key: string) {
  /* Wrapping this in a Promise so it can be awaited,
   * permitting this API to be designed as if it were
   * performing a lookup against a remote resource */
  return Promise.resolve(key === "379f84cc-1770-4bbe-8365-943d05cd05ad");
}
