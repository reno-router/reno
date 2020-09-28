// deno-lint-ignore-file no-undef

import frisby from "frisby";

describe("/", () => {
  it("should return the expected response", () =>
    frisby.get("http://localhost:8000/")
      .expect("status", 200)
      .expect("header", "Cache-Control", "max-age=86400")
      .expect("header", "Set-Cookie", "requested_proto=HTTP/1.1")
      .expect("jsonStrict", {
        foo: "bar",
        isLol: true,
      }));

  describe("/does-not-exist", () => {
    it("should return a HTTP 404", () =>
      frisby.get("http://localhost:8000/does-not-exist")
        .expect("status", 404)
        .expect("header", "Content-Type", "text/plain")
        .expect("bodyContains", "No match for /does-not-exist"));
  });
});
