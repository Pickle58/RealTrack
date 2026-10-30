import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const clerk = clerkMiddleware();

/**
 * Clerk's session cookie (plus the development-instance JWT cookie) marks a response as
 * per-user. Cloudflare does not edge-cache Worker responses by default; this keeps that true
 * even if a Cache Rule is added later.
 */
function hasSession(request: NextRequest): boolean {
  return request.cookies.has("__session") || request.cookies.has("__clerk_db_jwt");
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // A handshake or protect() redirect is a Response of its own; leave it untouched.
  const handshake = await clerk(request, event);
  if (handshake) return handshake;

  if (!hasSession(request)) return;

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
