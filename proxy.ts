import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isMissingRecord, slugKeyFor } from "@/lib/links/resolve";

/**
 * Short links are resolved here rather than in a route handler: a hit is
 * answered with a redirect before any rendering, and a miss falls through
 * to the app, which has no route for it and renders the styled 404 page.
 */
export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  const slugKey = slugKeyFor(request.nextUrl.pathname.slice(1));
  if (!slugKey) return NextResponse.next();

  const longUrl = await lookup(slugKey, request.method !== "HEAD");
  if (!longUrl) return NextResponse.next();

  // 302, not 301: browsers cache 301s forever, which would skip the click
  // count on repeat visits and make the destination impossible to change.
  return new NextResponse(null, { status: 302, headers: { Location: longUrl, "Cache-Control": "no-store" } });
}

async function lookup(slugKey: string, countClick: boolean): Promise<string | null> {
  // Link checkers and unfurlers often send HEAD first; don't count those.
  if (!countClick) {
    const link = await prisma.link.findUnique({ where: { slugKey }, select: { longUrl: true } });
    return link?.longUrl ?? null;
  }
  try {
    // Look up and count in one statement so concurrent clicks don't race.
    const link = await prisma.link.update({
      where: { slugKey },
      data: { clicks: { increment: 1 } },
      select: { longUrl: true },
    });
    return link.longUrl;
  } catch (err) {
    if (isMissingRecord(err)) return null;
    throw err;
  }
}

export const config = {
  // Only single path segments that look like a slug; everything else
  // (/, /api/*, /_next/*, files with dots) never reaches the database.
  matcher: ["/:slug([A-Za-z0-9_-]{3,32})"],
};
