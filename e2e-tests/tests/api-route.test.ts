import frisby, { Joi } from "frisby";

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

  describe("/set-cookies", () => {
    it("should set the expected cookie headers", () =>
      frisby.get("http://localhost:8000/api/set-cookies")
        .expect("status", 200)
        .expect("header", "Content-Type", "text/plain")
        .expect("header", "Set-Cookie", "deno-playground-foo=bar")
        .expect("header", "Set-Cookie", "deno-playground-bar=baz")
        .expect("bodyContains", "Cookies set!")
    );
  });

  describe("/streamed-response", () => {
    it("should return the expected response", () =>
      frisby.get("http://localhost:8000/api/streamed-response")
        .expect("status", 200)
        .expect("bodyContains", "This was written directly to the request reference`s underlying socket!")
    );
  });

  describe("/ron-swanson-quote", () => {
    it("should return a single quote by default", () =>
      frisby.get("http://localhost:8000/api/ron-swanson-quote")
        .expect("status", 200)
        .expect("header", "Content-Type", "application/json")
        .expect("jsonTypes", Joi.array().items(Joi.string()).length(1))
    );

    it("should return the number of quotes specified in the route param if provided", () =>
      frisby.get("http://localhost:8000/api/ron-swanson-quote/8")
        .expect("status", 200)
        .expect("header", "Content-Type", "application/json")
        .expect("jsonTypes", Joi.array().items(Joi.string()).length(8))
    );
  });
});
