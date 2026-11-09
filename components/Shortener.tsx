"use client";

import { ShortenerCard } from "./ShortenerCard";
import { useShortener } from "./useShortener";

export function Shortener({ domain }: { domain: string }) {
  const shortener = useShortener(domain);
  return <ShortenerCard shortener={shortener} domain={domain} />;
}
