import { ALIAS_PATTERN, isReservedAlias } from "./rules";

/**
 * The lookup key for a path segment, or null if it can't be a short link.
 * Every slug we hand out (generated or alias) matches ALIAS_PATTERN.
 */
export function slugKeyFor(segment: string): string | null {
  if (!ALIAS_PATTERN.test(segment) || isReservedAlias(segment)) return null;
  return segment.toLowerCase();
}

export function isMissingRecord(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2025";
}
