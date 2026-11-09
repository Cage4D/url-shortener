import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createLink } from "@/lib/links/create";
import { MESSAGES } from "@/lib/links/messages";
import { parseCreateLink, shortDomain, shortUrlFor, type FieldError } from "@/lib/links/rules";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

function fail(status: number, error: FieldError, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

export async function POST(request: NextRequest) {
  const { allowed, retryAfterSec } = limiter(clientIp(request.headers));
  if (!allowed) {
    return fail(429, { field: "url", message: MESSAGES.rateLimited }, { "Retry-After": String(retryAfterSec) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, { field: "url", message: MESSAGES.empty });
  }

  const domain = shortDomain();
  const parsed = parseCreateLink(body, domain);
  if (!parsed.ok) return fail(400, parsed.error);

  try {
    const result = await createLink(parsed.data, (data) =>
      prisma.link.create({ data, select: { slug: true, slugKey: true, longUrl: true, createdAt: true } }),
    );
    if (!result.ok) return fail(result.status, result.error);

    const { slug, longUrl, createdAt } = result.link;
    return NextResponse.json(
      { slug, shortUrl: shortUrlFor(slug, domain), longUrl, createdAt: createdAt.toISOString() },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to create link", err);
    return fail(500, { field: "url", message: MESSAGES.network });
  }
}
