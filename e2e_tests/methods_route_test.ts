import { SuperDeno, superdeno } from "./deps.ts";
import app from "../example/app.ts";

["GET", "POST"].forEach((method) => {
  Deno.test(`/methods/endpoint should allow HTTP ${method}`, async () => {
    await superdeno(app)[method.toLowerCase() as keyof SuperDeno](
      "/methods/endpoint",
    )
      .expect(200)
      .expect("Content-Type", "text/plain;charset=UTF-8")
      .expect(`You performed a HTTP ${method}!`);
  });
});

["PATCH", "PUT", "DELETE", "OPTIONS"].forEach((method) => {
  Deno.test(`/methods/endpoint should not allow HTTP ${method}`, async () => {
    await superdeno(app)[method.toLowerCase() as keyof SuperDeno](
      "/methods/endpoint",
    )
      .expect(405)
      .expect("Content-Type", "text/plain;charset=UTF-8")
      .expect(
        `Method ${method} not allowed for /methods/endpoint`,
      );
  });
});
