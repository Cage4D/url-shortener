/**
 * Recent links kept in this browser's localStorage. Shaped as an external
 * store so components can read it with useSyncExternalStore.
 */

export type RecentLink = { slug: string; shortUrl: string; longUrl: string; createdAt: string };

export const RECENT_KEY = "shortcut:recent";
export const RECENT_MAX = 5;

const EMPTY: RecentLink[] = [];

function isRecentLink(value: unknown): value is RecentLink {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.shortUrl === "string" &&
    typeof v.longUrl === "string" &&
    typeof v.createdAt === "string"
  );
}

/** Whatever is in storage, reduced to valid entries. Never throws. */
export function parseRecent(raw: string | null): RecentLink[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isRecentLink).slice(0, RECENT_MAX) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Newest first, no duplicate slugs, capped at RECENT_MAX. */
export function withRecent(list: RecentLink[], link: RecentLink): RecentLink[] {
  const key = link.slug.toLowerCase();
  return [link, ...list.filter((x) => x.slug.toLowerCase() !== key)].slice(0, RECENT_MAX);
}

let cache: RecentLink[] | null = null;
const listeners = new Set<() => void>();

function read(): RecentLink[] {
  try {
    return parseRecent(window.localStorage.getItem(RECENT_KEY));
  } catch {
    return EMPTY;
  }
}

function write(list: RecentLink[]) {
  cache = list;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Storage can be full or blocked; the list still works for this visit.
  }
  listeners.forEach((notify) => notify());
}

export const recentLinks = {
  subscribe(notify: () => void) {
    listeners.add(notify);
    // Keep other tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== RECENT_KEY && e.key !== null) return;
      cache = read();
      notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(notify);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): RecentLink[] {
    if (cache === null) cache = read();
    return cache;
  },
  getServerSnapshot(): RecentLink[] {
    return EMPTY;
  },
  add(link: RecentLink) {
    write(withRecent(recentLinks.getSnapshot(), link));
  },
  clear() {
    write(EMPTY);
  },
};
