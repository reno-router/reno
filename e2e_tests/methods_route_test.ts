import { superdeno, SuperDeno } from "./deps.ts";
import app from "../example/app.ts";

["GET", "POST"].forEach((method) => {
  Deno.test(`/methods-endpoint should allow HTTP ${method}`, async () => {
    await superdeno(app)[method.toLowerCase() as keyof SuperDeno](
      "/methods/endpoint",
    )
      .expect(200)
      .expect("Content-Type", "text/plain")
      .expect(`You performed a HTTP ${method}!`);
  });
});

["PATCH", "PUT", "DELETE", "OPTIONS"].forEach((method) => {
  Deno.test(`/methods-endpoint should not allow HTTP ${method}`, async () => {
    await superdeno(app)[method.toLowerCase() as keyof SuperDeno](
      "/methods/endpoint",
    )
      .expect(405)
      .expect("Content-Type", "text/plain")
      .expect(
        `Method ${method} not allowed for /methods/endpoint`,
      );
  });
});
