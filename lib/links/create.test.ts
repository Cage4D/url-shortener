import { describe, expect, it, vi } from "vitest";
import { MESSAGES } from "./messages";
import { MAX_SLUG_ATTEMPTS, SlugSpaceExhaustedError, createLink, type NewLink } from "./create";

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
});
