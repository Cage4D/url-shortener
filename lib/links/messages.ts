// User-facing copy. These strings are shown as-is, so keep them in one place.
export const MESSAGES = {
  empty: "Paste a link first.",
  unparseable: "That doesn't look like a link — try example.com/page.",
  badScheme: "Only http and https links can be shortened.",
  noDot: "That link is missing a domain, like .com or .ng.",
  ownDomain: "That link is already short.",
  tooLong: "That link is too long. Links can be up to 2,048 characters.",
  badAlias: "Aliases are 3–32 characters: letters, numbers, - or _.",
  aliasTaken: "That alias is already taken. Try another.",
  network: "Couldn't shorten that link. Check your connection and try again.",
  rateLimited: "You're shortening links too quickly. Wait a minute and try again.",
} as const;
