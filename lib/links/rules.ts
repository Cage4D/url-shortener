import { z } from "zod";
import { MESSAGES } from "./messages";

export const MAX_URL_LENGTH = 2048;
export const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

// Paths the app itself needs; an alias can't claim them.
export const RESERVED_ALIASES = new Set([
  "api",
  "_next",
  "static",
  "public",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "not-found",
  "_not-found",
  "404",
  "500",
]);

// A scheme is "letters:" not followed by a digit, so "example.com:8080"
// counts as schemeless while "mailto:" and "ftp://" do not.
const SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/** The short domain without scheme or trailing slash, e.g. "short.cut". */
export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export function shortDomain(): string {
  return normalizeDomain(process.env.NEXT_PUBLIC_SHORT_DOMAIN || "localhost:3000");
}

/** Full short URL. Local dev hosts get http, everything else https. */
export function shortUrlFor(slug: string, domain: string): string {
  const host = normalizeDomain(domain);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}/${slug}`;
}

export type UrlResult = { ok: true; url: string } | { ok: false; message: string };

export function normalizeUrl(raw: string, domain: string): UrlResult {
  let value = raw.trim();
  if (!value) return { ok: false, message: MESSAGES.empty };
  if (!SCHEME.test(value)) value = `https://${value}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, message: MESSAGES.unparseable };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: MESSAGES.badScheme };
  }
  const own = normalizeDomain(domain);
  if (parsed.host === own || parsed.hostname === own) {
    return { ok: false, message: MESSAGES.ownDomain };
  }

  if (!parsed.hostname.includes(".")) return { ok: false, message: MESSAGES.noDot };

  if (parsed.href.length > MAX_URL_LENGTH) return { ok: false, message: MESSAGES.tooLong };
  return { ok: true, url: parsed.href };
}

export function isReservedAlias(alias: string): boolean {
  return RESERVED_ALIASES.has(alias.toLowerCase());
}

/** The request body for POST /api/links, shared by the form and the API. */
export function createLinkSchema(domain: string) {
  return z.object({
    url: z.string({ error: MESSAGES.empty }).transform((raw, ctx) => {
      const result = normalizeUrl(raw, domain);
      if (result.ok) return result.url;
      ctx.addIssue({ code: "custom", message: result.message });
      return z.NEVER;
    }),
    alias: z
      .string({ error: MESSAGES.badAlias })
      .optional()
      .transform((raw, ctx) => {
        const alias = raw?.trim();
        if (!alias) return undefined;
        if (!ALIAS_PATTERN.test(alias)) {
          ctx.addIssue({ code: "custom", message: MESSAGES.badAlias });
          return z.NEVER;
        }
        if (isReservedAlias(alias)) {
          ctx.addIssue({ code: "custom", message: MESSAGES.aliasTaken });
          return z.NEVER;
        }
        return alias;
      }),
  });
}

export type CreateLinkInput = z.output<ReturnType<typeof createLinkSchema>>;
export type FieldError = { field: "url" | "alias"; message: string };

/** Validate a create request; reports the first problem, URL before alias. */
export function parseCreateLink(
  input: unknown,
  domain: string,
): { ok: true; data: CreateLinkInput } | { ok: false; error: FieldError } {
  const result = createLinkSchema(domain).safeParse(input ?? {});
  if (result.success) return { ok: true, data: result.data };

  const issues = result.error.issues;
  const issue = issues.find((i) => i.path[0] === "url") ?? issues[0];
  const field = issue.path[0] === "alias" ? "alias" : "url";
  return { ok: false, error: { field, message: issue.message } };
}
