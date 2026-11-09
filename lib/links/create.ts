import { MESSAGES } from "./messages";
import { ALIAS_PATTERN, isReservedAlias, type FieldError } from "./rules";
import { generateSlug } from "./slug";

export const MAX_SLUG_ATTEMPTS = 5;
// A suggested alias tries itself, then -2 to -5, then a few random endings.
const NUMBERED_SUFFIXES = 4;
const RANDOM_SUFFIXES = 5;
const RANDOM_SUFFIX_LENGTH = 4;
const MAX_ALIAS_LENGTH = 32;

export type NewLink = { slug: string; slugKey: string; longUrl: string };
export type SavedLink = NewLink & { createdAt: Date };

export type CreateResult =
  | { ok: true; link: SavedLink }
  | { ok: false; status: 409; error: FieldError };

export class SlugSpaceExhaustedError extends Error {
  constructor() {
    super(`Couldn't find a free slug after ${MAX_SLUG_ATTEMPTS} attempts`);
  }
}

/** Prisma reports unique constraint violations as P2002. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

/** "kuda-2", trimming the alias so the result stays within 32 characters. */
export function withSuffix(alias: string, suffix: string): string {
  const room = MAX_ALIAS_LENGTH - suffix.length - 1;
  return `${alias.slice(0, room).replace(/-+$/, "")}-${suffix}`;
}

/** Aliases to try, in order, for one the form suggested from the link. */
export function suggestedAliases(alias: string, makeSuffix: () => string): string[] {
  const numbered = Array.from({ length: NUMBERED_SUFFIXES }, (_, i) => withSuffix(alias, String(i + 2)));
  const random = Array.from({ length: RANDOM_SUFFIXES }, () => withSuffix(alias, makeSuffix()));
  return [alias, ...numbered, ...random].filter((a) => ALIAS_PATTERN.test(a) && !isReservedAlias(a));
}

const randomSuffix = () => generateSlug().slice(0, RANDOM_SUFFIX_LENGTH).toLowerCase();

/**
 * Save a link. The unique index on slug_key is the real guarantee: we
 * just try to insert and react to a conflict, rather than checking first
 * and racing another request.
 */
export async function createLink(
  { url, alias, aliasSuggested }: { url: string; alias?: string; aliasSuggested?: boolean },
  insert: (link: NewLink) => Promise<SavedLink>,
  makeSlug: () => string = generateSlug,
  makeSuffix: () => string = randomSuffix,
): Promise<CreateResult> {
  if (alias) {
    // A typed alias is used as is; a suggested one may get a suffix.
    const candidates = aliasSuggested ? suggestedAliases(alias, makeSuffix) : [alias];
    for (const slug of candidates) {
      try {
        return { ok: true, link: await insert({ slug, slugKey: slug.toLowerCase(), longUrl: url }) };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }
    return { ok: false, status: 409, error: { field: "alias", message: MESSAGES.aliasTaken } };
  }

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = makeSlug();
    try {
      return { ok: true, link: await insert({ slug, slugKey: slug.toLowerCase(), longUrl: url }) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new SlugSpaceExhaustedError();
}
