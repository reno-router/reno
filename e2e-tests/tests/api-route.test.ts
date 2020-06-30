import frisby from "frisby";

describe("/api", () => {
  describe("/json-body", () => {
    it("should return the body passed via the request", () =>
      frisby.post("http://localhost:8000/api/json-body", {
        name: "James",
        age: 30,
      })
        .expect("status", 200)
        .expect("header", "Content-Type", "application/json")
        .expect("jsonStrict", {
          message: "Here's the body you posted to this endpoint",
          name: "James",
          age: 30,
        }));

    it("should return HTTP 405 when a non-POST method is used", () =>
      frisby.put("http://localhost:8000/api/json-body", {
        name: "James",
        age: 30,
      })
        .expect("status", 405)
        .expect("header", "Content-Type", "text/plain")
        .expect("bodyContains", "Method PUT not allowed for /api/json-body"));
  });
});
