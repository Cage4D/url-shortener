import { describe, expect, it, vi } from "vitest";
import { MESSAGES } from "./messages";
import {
  MAX_SLUG_ATTEMPTS,
  SlugSpaceExhaustedError,
  createLink,
  suggestedAliases,
  withSuffix,
  type NewLink,
} from "./create";

const conflict = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
const saved = (link: NewLink) => Promise.resolve({ ...link, createdAt: new Date(0) });

describe("createLink", () => {
  it("saves a generated slug with a lower-cased key", async () => {
    const insert = vi.fn(saved);
    const result = await createLink({ url: "https://example.com/" }, insert, () => "AbCdEfG");
    expect(insert).toHaveBeenCalledWith({ slug: "AbCdEfG", slugKey: "abcdefg", longUrl: "https://example.com/" });
    expect(result).toMatchObject({ ok: true, link: { slug: "AbCdEfG" } });
  });

  it("retries with a new slug on collision", async () => {
    const insert = vi.fn(saved).mockRejectedValueOnce(conflict).mockRejectedValueOnce(conflict);
    const slugs = ["aaaaaaa", "bbbbbbb", "ccccccc"];
    const result = await createLink({ url: "https://example.com/" }, insert, () => slugs.shift()!);
    expect(insert).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ ok: true, link: { slug: "ccccccc" } });
  });

  it(`gives up after ${MAX_SLUG_ATTEMPTS} collisions`, async () => {
    const insert = vi.fn(() => Promise.reject(conflict));
    await expect(createLink({ url: "https://example.com/" }, insert, () => "aaaaaaa")).rejects.toBeInstanceOf(
      SlugSpaceExhaustedError,
    );
    expect(insert).toHaveBeenCalledTimes(MAX_SLUG_ATTEMPTS);
  });

  it("uses the alias as the slug and reports a taken alias as 409", async () => {
    const ok = await createLink({ url: "https://example.com/", alias: "My-Link" }, saved);
    expect(ok).toMatchObject({ ok: true, link: { slug: "My-Link", slugKey: "my-link" } });

    const insert = vi.fn(() => Promise.reject(conflict));
    const taken = await createLink({ url: "https://example.com/", alias: "My-Link" }, insert);
    expect(taken).toEqual({ ok: false, status: 409, error: { field: "alias", message: MESSAGES.aliasTaken } });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("passes other database errors through", async () => {
    const boom = new Error("connection refused");
    await expect(createLink({ url: "https://example.com/" }, () => Promise.reject(boom))).rejects.toBe(boom);
  });

  it("adds -2, -3… to a suggested alias that's taken", async () => {
    const insert = vi.fn(saved).mockRejectedValueOnce(conflict).mockRejectedValueOnce(conflict);
    const result = await createLink({ url: "https://kuda.com/", alias: "kuda", aliasSuggested: true }, insert);
    expect(insert.mock.calls.map(([l]) => l.slug)).toEqual(["kuda", "kuda-2", "kuda-3"]);
    expect(result).toMatchObject({ ok: true, link: { slug: "kuda-3", slugKey: "kuda-3" } });
  });

  it("moves on to random endings, then reports the alias as taken", async () => {
    const insert = vi.fn(() => Promise.reject(conflict));
    const result = await createLink(
      { url: "https://kuda.com/", alias: "kuda", aliasSuggested: true },
      insert,
      undefined,
      () => "zz9q",
    );
    const tried = (insert.mock.calls as unknown as [NewLink][]).map(([l]) => l.slug);
    expect(tried.slice(0, 6)).toEqual(["kuda", "kuda-2", "kuda-3", "kuda-4", "kuda-5", "kuda-zz9q"]);
    expect(tried).toHaveLength(10);
    expect(result).toEqual({ ok: false, status: 409, error: { field: "alias", message: MESSAGES.aliasTaken } });
  });

  it("never adds a suffix to an alias the person typed", async () => {
    const insert = vi.fn(() => Promise.reject(conflict));
    await createLink({ url: "https://kuda.com/", alias: "kuda", aliasSuggested: false }, insert);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});

describe("suggested aliases", () => {
  it("stays within 32 characters and never ends the base in a dash", () => {
    expect(withSuffix("a".repeat(32), "2")).toBe(`${"a".repeat(30)}-2`);
    expect(withSuffix(`${"a".repeat(29)}-bc`, "2")).toBe(`${"a".repeat(29)}-2`);
  });

  it("skips reserved names, so api becomes api-2", () => {
    expect(suggestedAliases("api", () => "abcd")[0]).toBe("api-2");
  });
});
