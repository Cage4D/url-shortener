import { describe, expect, it } from "vitest";
import { charactersSaved } from "./stats";

describe("charactersSaved", () => {
  it("counts the characters the short link saves", () => {
    expect(charactersSaved("https://example.com/a/very/long/path", "https://getshortcut.vercel.app/abc")).toBe(2);
  });

  it("returns null when nothing is saved, so the readout can show a dash", () => {
    expect(charactersSaved("https://example.com/a", "https://getshortcut.vercel.app/Abc1234")).toBeNull();
    expect(charactersSaved("https://abc.de/xyz", "https://abc.de/xyz")).toBeNull();
  });
});
