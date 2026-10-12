import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("provides a browser document", () => {
    expect(document).toBeDefined();
  });
});
