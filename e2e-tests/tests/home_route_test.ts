import { superdeno } from "../deps.ts";
import app from "../../example/app.ts";

Deno.test("/ should return the expected response", async () => {
  await superdeno(app).get("/")
    .expect(200)
    .expect("Cache-Control", "max-age=86400")
    .expect("Set-Cookie", "requested_proto=HTTP/1.1")
    .expect({
      foo: "bar",
      isLol: true,
    });
});

Deno.test("/does-not-exist should return a HTTP 404", async () => {
  await superdeno(app).get("/does-not-exist")
    .expect(404)
    .expect("Content-Type", "text/plain")
    .expect("No match for /does-not-exist");
});
