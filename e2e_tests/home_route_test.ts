import { superdeno } from "./deps.ts";
import app from "../example/app.ts";

Deno.test("/ should return the expected response", async () => {
  await superdeno(app).get("/")
    .expect(200)
    .expect("Cache-Control", "max-age=86400")
    .expect("Set-Cookie", "requested_method=GET")
    .expect({
      foo: "bar",
      isLol: true,
    });
});

Deno.test("/profile should return a HTTP 200 if the API key is valid", async () => {
  await superdeno(app).get("/profile")
    .set("Authorization", "Bearer 379f84cc-1770-4bbe-8365-943d05cd05ad")
    .expect(200)
    .expect("Your profile!");
});

Deno.test("/profile should return a HTTP 401 if the API key is invalid", async () => {
  await superdeno(app).get("/profile")
    .set("Authorization", "Bearer 21c89826-fa63-42a5-90ea-8fe8eda40d29")
    .expect(401)
    .expect("API key not authorised to access /profile");
});

Deno.test("/profile should return a HTTP 401 if the API key is not set", async () => {
  await superdeno(app).get("/profile")
    .expect(401)
    .expect("API key not authorised to access /profile");
});

Deno.test("/does-not-exist should return a HTTP 404", async () => {
  await superdeno(app).get("/does-not-exist")
    .expect(404)
    .expect("Content-Type", "text/plain;charset=UTF-8")
    .expect("No match for /does-not-exist");
});
