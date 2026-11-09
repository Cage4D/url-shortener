import { MESSAGES } from "./messages";
import type { FieldError } from "./rules";
import { generateSlug } from "./slug";

export const MAX_SLUG_ATTEMPTS = 5;

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

/**
 * Save a link. The unique index on slug_key is the real guarantee: we
 * just try to insert and react to a conflict, rather than checking first
 * and racing another request.
 */
export async function createLink(
  { url, alias }: { url: string; alias?: string },
  insert: (link: NewLink) => Promise<SavedLink>,
  makeSlug: () => string = generateSlug,
): Promise<CreateResult> {
  if (alias) {
    try {
      return { ok: true, link: await insert({ slug: alias, slugKey: alias.toLowerCase(), longUrl: url }) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      return { ok: false, status: 409, error: { field: "alias", message: MESSAGES.aliasTaken } };
    }
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
