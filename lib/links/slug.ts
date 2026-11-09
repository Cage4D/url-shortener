import { randomInt } from "node:crypto";

// No look-alikes: 0 O 1 l I are left out.
export const SLUG_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const SLUG_LENGTH = 7;

export function generateSlug(): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return slug;
}
