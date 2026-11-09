import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { normalizeDomain, normalizeUrl, parseCreateLink } from "./rules";

const DOMAIN = "short.cut";
const url = (raw: string) => normalizeUrl(raw, DOMAIN);
const parse = (body: unknown) => parseCreateLink(body, DOMAIN);

describe("normalizeUrl", () => {
  it("trims and prepends https:// when there is no scheme", () => {
    expect(url("  example.com/page  ")).toEqual({ ok: true, url: "https://example.com/page" });
  });

  it("keeps an explicit http or https scheme", () => {
    expect(url("http://example.com")).toEqual({ ok: true, url: "http://example.com/" });
    expect(url("HTTPS://Example.com/A?b=1#c")).toEqual({ ok: true, url: "https://example.com/A?b=1#c" });
  });

  it("treats host:port as schemeless", () => {
    expect(url("example.com:8080/x")).toEqual({ ok: true, url: "https://example.com:8080/x" });
  });

  it("rejects empty input", () => {
    expect(url("")).toEqual({ ok: false, message: MESSAGES.empty });
    expect(url("   ")).toEqual({ ok: false, message: MESSAGES.empty });
  });

  it("rejects input that doesn't parse", () => {
    expect(url("not a link")).toEqual({ ok: false, message: MESSAGES.unparseable });
    expect(url("http://")).toEqual({ ok: false, message: MESSAGES.unparseable });
  });

  it("rejects schemes other than http and https", () => {
    for (const raw of ["ftp://example.com/file", "mailto:me@example.com", "javascript:alert(1)"]) {
      expect(url(raw)).toEqual({ ok: false, message: MESSAGES.badScheme });
    }
  });

  it("rejects hosts without a dot", () => {
    expect(url("localhost:3000")).toEqual({ ok: false, message: MESSAGES.noDot });
    expect(url("https://intranet/page")).toEqual({ ok: false, message: MESSAGES.noDot });
  });

  it("rejects links on our own short domain", () => {
    expect(url("short.cut/abc1234")).toEqual({ ok: false, message: MESSAGES.ownDomain });
    expect(url("https://SHORT.CUT/x")).toEqual({ ok: false, message: MESSAGES.ownDomain });
    expect(normalizeUrl("https://sho.rt:3000/x", "http://sho.rt:3000/")).toEqual({
      ok: false,
      message: MESSAGES.ownDomain,
    });
  });

  it("allows links up to 2048 characters and rejects longer ones", () => {
    const base = "https://example.com/";
    expect(url(base + "a".repeat(2048 - base.length)).ok).toBe(true);
    expect(url(base + "a".repeat(2049 - base.length))).toEqual({ ok: false, message: MESSAGES.tooLong });
  });
});

describe("normalizeDomain", () => {
  it("strips scheme, trailing slashes and casing", () => {
    expect(normalizeDomain(" https://Short.Cut// ")).toBe("short.cut");
  });
});

describe("parseCreateLink", () => {
  it("returns the normalised url and trimmed alias", () => {
    expect(parse({ url: "example.com", alias: "  My-Link_1 " })).toEqual({
      ok: true,
      data: { url: "https://example.com/", alias: "My-Link_1" },
    });
  });

  it("treats a missing or blank alias as no alias", () => {
    expect(parse({ url: "example.com" })).toEqual({ ok: true, data: { url: "https://example.com/" } });
    expect(parse({ url: "example.com", alias: "  " })).toEqual({
      ok: true,
      data: { url: "https://example.com/", alias: undefined },
    });
  });

  it("reports url problems on the url field", () => {
    expect(parse({ url: "" })).toEqual({ ok: false, error: { field: "url", message: MESSAGES.empty } });
    expect(parse({})).toEqual({ ok: false, error: { field: "url", message: MESSAGES.empty } });
    expect(parse(null)).toEqual({ ok: false, error: { field: "url", message: MESSAGES.empty } });
    expect(parse({ url: 42 })).toEqual({ ok: false, error: { field: "url", message: MESSAGES.empty } });
  });

  it("reports the url error first when both fields are bad", () => {
    expect(parse({ url: "ftp://x.com", alias: "!" })).toEqual({
      ok: false,
      error: { field: "url", message: MESSAGES.badScheme },
    });
  });

  it("enforces the alias pattern", () => {
    for (const alias of ["ab", "a".repeat(33), "has space", "dots.not.ok", "émoji"]) {
      expect(parse({ url: "example.com", alias })).toEqual({
        ok: false,
        error: { field: "alias", message: MESSAGES.badAlias },
      });
    }
    expect(parse({ url: "example.com", alias: "a".repeat(32) }).ok).toBe(true);
    expect(parse({ url: "example.com", alias: 5 })).toEqual({
      ok: false,
      error: { field: "alias", message: MESSAGES.badAlias },
    });
  });

  it("rejects reserved aliases regardless of case", () => {
    for (const alias of ["api", "API", "_next", "static"]) {
      expect(parse({ url: "example.com", alias })).toEqual({
        ok: false,
        error: { field: "alias", message: MESSAGES.aliasTaken },
      });
    }
  });
});
