import { describe, expect, it } from "vitest";
import { slugKeyFor } from "./resolve";

describe("slugKeyFor", () => {
  it("lower-cases valid slugs so lookups ignore case", () => {
    expect(slugKeyFor("AbCdEfG")).toBe("abcdefg");
    expect(slugKeyFor("my-link_2")).toBe("my-link_2");
  });

  it("skips segments that can't be short links", () => {
    for (const s of ["ab", "a".repeat(33), "robots.txt", "has space", "api", "API", "_next"]) {
      expect(slugKeyFor(s)).toBeNull();
    }
  });
});
