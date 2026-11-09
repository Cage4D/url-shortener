/**
 * Characters the short link saves over the original, or null when it
 * saves none. A 0 or a negative number would just look discouraging, and
 * with a long short domain that happens often, so the readout shows a
 * dash instead.
 */
export function charactersSaved(longUrl: string, shortUrl: string): number | null {
  const saved = longUrl.length - shortUrl.length;
  return saved > 0 ? saved : null;
}
