import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit per window, per key", () => {
    const hit = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect([1, 2, 3].map(() => hit("a", 1000).allowed)).toEqual([true, true, true]);
    expect(hit("a", 1000)).toEqual({ allowed: false, retryAfterSec: 60 });
    expect(hit("b", 1000).allowed).toBe(true);
  });

  it("starts a fresh window once the old one expires", () => {
    const hit = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(hit("a", 0).allowed).toBe(true);
    expect(hit("a", 59_999).allowed).toBe(false);
    expect(hit("a", 60_000).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
