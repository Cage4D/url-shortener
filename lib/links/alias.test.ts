import { describe, expect, it } from "vitest";
import { aliasFromUrl } from "./alias";

describe("aliasFromUrl", () => {
  it("keeps just the site name from a full link", () => {
    expect(aliasFromUrl("https://asdfghjkl.com")).toBe("asdfghjkl");
    expect(aliasFromUrl("http://www.Kuda.com/some/page?x=1#top")).toBe("kuda");
    expect(aliasFromUrl("example.org:8080/path")).toBe("example");
  });

  it("follows along while the link is typed", () => {
    const typed = "https://asdf.com";
    const steps = [...typed].map((_, i) => aliasFromUrl(typed.slice(0, i + 1)));
    expect(steps.slice(0, 8).every((s) => s === "")).toBe(true);
    expect(steps.slice(8)).toEqual(["a", "as", "asd", "asdf", "asdf", "asdf", "asdf", "asdf"]);
  });

  it("waits out a half-typed www.", () => {
    expect(aliasFromUrl("ww")).toBe("");
    expect(aliasFromUrl("www.")).toBe("");
    expect(aliasFromUrl("www.goo")).toBe("goo");
  });

  it("keeps subdomains and drops country-code endings", () => {
    expect(aliasFromUrl("https://docs.google.com/x")).toBe("docs-google");
    expect(aliasFromUrl("bbc.co.uk")).toBe("bbc");
  });

  it("only uses characters an alias allows, up to 32", () => {
    expect(aliasFromUrl("https://xn--caf-dma.fr")).toBe("xn-caf-dma");
    expect(aliasFromUrl(`https://${"a".repeat(40)}.com`)).toHaveLength(32);
  });
});
