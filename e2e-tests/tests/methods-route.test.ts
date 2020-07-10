import frisby from "frisby";

describe("/methods/endpoint", () => {
  ["GET", "POST"].forEach((method) => {
    it(`should allow HTTP ${method}`, () =>
      frisby[method.toLowerCase()]("http://localhost:8000/methods/endpoint")
        .expect("status", 200)
        .expect("header", "Content-Type", "text/plain")
        .expect("bodyContains", `You performed a HTTP ${method}!`));
  });

  ["PATCH", "PUT", "DELETE", "OPTIONS"].forEach((method) => {
    it(`should not allow HTTP ${method}`, () =>
      frisby[method.toLowerCase()]("http://localhost:8000/methods/endpoint")
        .expect("status", 405)
        .expect("header", "Content-Type", "text/plain")
        .expect(
          "bodyContains",
          `Method ${method} not allowed for /methods/endpoint`,
        ));
  });
});
