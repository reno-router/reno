import frisby from "frisby";

describe("/", () => {
  it("should return the expected response", () =>
    frisby.get("http://localhost:8000/")
      .expect("status", 200)
  );
});
