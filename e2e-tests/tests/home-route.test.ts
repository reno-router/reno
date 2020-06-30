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
      })
  );
});
