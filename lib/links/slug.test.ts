import { describe, expect, it } from "vitest";
import { SLUG_ALPHABET, generateSlug } from "./slug";

describe("generateSlug", () => {
  it("makes 7-character slugs from the safe alphabet", () => {
    for (let i = 0; i < 500; i++) expect(generateSlug()).toMatch(/^[a-km-zA-HJ-NP-Z2-9]{7}$/);
  });

  it("never uses look-alike characters", () => {
    for (const c of "0O1lI") expect(SLUG_ALPHABET).not.toContain(c);
    expect(SLUG_ALPHABET).toHaveLength(57);
  });

  it("doesn't repeat itself", () => {
    const seen = new Set(Array.from({ length: 1000 }, generateSlug));
    expect(seen.size).toBe(1000);
  });
});
