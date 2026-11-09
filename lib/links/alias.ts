// Second-level labels that come before a country code, as in bbc.co.uk.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "edu", "ac"]);
const MAX_ALIAS = 32;

/**
 * A suggested alias from what's in the link field so far: the site's name
 * without scheme, "www." or the ending. "https://asdfghjkl.com/page" gives
 * "asdfghjkl" and "docs.google.com" gives "docs-google". Works on
 * half-typed input too, so the alias can follow along as people type.
 */
export function aliasFromUrl(raw: string): string {
  const value = raw.trim().toLowerCase();
  // Still typing the scheme ("h", "http", "https:/"), or "www.".
  if (!value || "https://".startsWith(value) || "http://".startsWith(value)) return "";

  const host = value
    .replace(/^[a-z][a-z0-9+.-]*:(?!\d)\/*/, "") // scheme, but not "host:8080"
    .split(/[/?#]/)[0]
    .replace(/^[^@]*@/, "") // user:password@
    .replace(/:\d*$/, ""); // port
  if ("www.".startsWith(host)) return "";

  let labels = host.split(".").filter(Boolean);
  if (labels[0] === "www") labels = labels.slice(1);
  if (labels.length > 1) labels = labels.slice(0, -1);
  if (labels.length > 1 && SECOND_LEVEL.has(labels[labels.length - 1])) labels = labels.slice(0, -1);

  return labels
    .join("-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_ALIAS)
    .replace(/-+$/, "");
}
