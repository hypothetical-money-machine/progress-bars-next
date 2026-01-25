import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("Testing Infrastructure Setup", () => {
  it("should run basic unit tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("should run property-based tests with fast-check", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property of addition
      }),
      { numRuns: 100 },
    );
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
