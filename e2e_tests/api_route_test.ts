import { superdeno } from "./deps.ts";
import app from "../example/app.ts";

Deno.test("/api/json-body should return the body passed via the request", async () => {
  await superdeno(app).post("/api/json-body")
    .send({
      name: "James",
      age: 30,
    })
    .expect(200)
    .expect("Content-Type", "application/json")
    .expect({
      message: "Here's the body you posted to this endpoint",
      name: "James",
      age: 30,
    });
});

Deno.test("/api/json-body should return HTTP 405 when a non-POST method is used", async () => {
  await superdeno(app).put("/api/json-body")
    .send({
      name: "James",
      age: 30,
    })
    .expect(405)
    .expect("Content-Type", "text/plain")
    .expect("Method PUT not allowed for /api/json-body");
});

Deno.test("/set-cookies should set the expected cookie headers", async () => {
  await superdeno(app).get("/api/set-cookies")
    .expect(200)
    .expect("Content-Type", "text/plain")
    .expect("Set-Cookie", "deno-playground-foo=bar, deno-playground-bar=baz")
    .expect("Cookies set!");
});

Deno.test("/streamed-response should return the expected response", async () => {
  await superdeno(app).get("/api/streamed-response")
    .expect(200)
    .expect(
      "This was written directly to the request reference`s underlying socket!",
    );
});

Deno.test("/ron-swanson-quote should return a single quote by default", async () => {
  await superdeno(app).get("/api/ron-swanson-quote")
    .expect(200)
    .expect("Content-Type", "application/json")
    .expect((res) => {
      if (res.body.length !== 1) {
        throw new Error(`Expected 1 quotes, but received ${res.body.length}`);
      }
    });
});

Deno.test("/ron-swanson-quote should return the number of quotes specified in the route param if provided", async () => {
  await superdeno(app).get("/api/ron-swanson-quote/8")
    .expect(200)
    .expect("Content-Type", "application/json")
    .expect((res) => {
      if (res.body.length !== 8) {
        throw new Error(`Expected 8 quotes, but received ${res.body.length}`);
      }
    });
});

Deno.test("/wildcard-route-params should successfully parse the route params", async () => {
  await superdeno(app).get(
    "/api/wildcard-route-params/authors/bob/posts/post-1",
  )
    .expect(200)
    .expect("Content-Type", "text/plain")
    .expect("You requested post-1 by bob");
});
