type Window = { start: number; count: number };

/**
 * Fixed-window counter per key, kept in memory. Good enough for a single
 * server; it resets on restart and isn't shared between instances.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, Window>();
  let lastSweep = 0;

  return function hit(key: string, now = Date.now()) {
    // Drop expired windows now and then so the map doesn't grow forever.
    if (now - lastSweep > windowMs) {
      for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      lastSweep = now;
    }

    let w = windows.get(key);
    if (!w || now - w.start >= windowMs) {
      w = { start: now, count: 0 };
      windows.set(key, w);
    }
    w.count++;

    const allowed = w.count <= limit;
    const retryAfterSec = Math.ceil((w.start + windowMs - now) / 1000);
    return { allowed, retryAfterSec };
  };
}

/** Best guess at the caller's IP from the usual proxy headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
