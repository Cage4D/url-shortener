import { describe, expect, it } from "vitest";
import { RECENT_MAX, parseRecent, withRecent, type RecentLink } from "./recent";

const link = (slug: string): RecentLink => ({
  slug,
  shortUrl: `https://short.cut/${slug}`,
  longUrl: "https://example.com/",
  createdAt: "2026-11-09T12:00:00.000Z",
});

describe("parseRecent", () => {
  it("survives missing, broken or wrongly shaped data", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("{nope")).toEqual([]);
    expect(parseRecent('{"slug":"a"}')).toEqual([]);
    expect(parseRecent(JSON.stringify([link("aaa"), { slug: 1 }, null]))).toEqual([link("aaa")]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 9 }, (_, i) => link(`s${i}x`));
    expect(parseRecent(JSON.stringify(many))).toHaveLength(RECENT_MAX);
  });
});

describe("withRecent", () => {
  it("puts the new link first and drops duplicates case-insensitively", () => {
    const list = [link("aaa"), link("bbb")];
    expect(withRecent(list, link("BBB")).map((x) => x.slug)).toEqual(["BBB", "aaa"]);
  });

  it("keeps only the newest five", () => {
    let list: RecentLink[] = [];
    for (const s of ["s1x", "s2x", "s3x", "s4x", "s5x", "s6x"]) list = withRecent(list, link(s));
    expect(list.map((x) => x.slug)).toEqual(["s6x", "s5x", "s4x", "s3x", "s2x"]);
  });
});
