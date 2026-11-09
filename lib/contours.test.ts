import { describe, expect, it } from "vitest";
import { cachedContourPaths, contourPaths, splitLines } from "./contours";

describe("contourPaths", () => {
  it("is deterministic for a given size", () => {
    expect(contourPaths(640, 400)).toEqual(contourPaths(640, 400));
  });

  it("produces one path per interior level, made of polylines", () => {
    const paths = contourPaths(1440, 900);
    expect(paths.length).toBeGreaterThan(10);
    expect(paths.length).toBeLessThanOrEqual(14);
    for (const d of paths) expect(d).toMatch(/^M[\d.-]+ [\d.-]+(?:[ML][\d.-]+ [\d.-]+)+$/);
  });

  it("returns nothing for an empty viewport", () => {
    expect(contourPaths(0, 900)).toEqual([]);
  });

  it("caches by rounded size", () => {
    expect(cachedContourPaths(320.2, 200)).toBe(cachedContourPaths(320.4, 200));
  });
});

describe("splitLines", () => {
  it("splits path data into polylines and measures them", () => {
    expect(splitLines("M0 0L3 4L3 10M5 5L5 6")).toEqual([
      { d: "M0 0L3 4L3 10", length: 11 },
      { d: "M5 5L5 6", length: 1 },
    ]);
  });

  it("covers every line in a real map", () => {
    const d = contourPaths(640, 400)[3];
    expect(splitLines(d).map((l) => l.d).join("")).toBe(d);
  });
});
