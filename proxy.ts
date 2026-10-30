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
  // Clerk answers every request with its own response: a redirect for the handshake or
  // auth.protect(), or a next() continuation that may carry a refreshed session cookie.
  const response = await clerk(request, event);

  // A handshake or protect() redirect is a Response of its own; leave it untouched.
  if (response instanceof Response && response.headers.has("location")) return response;

  // Label Clerk's own next() response rather than minting a new one, so its session
  // cookies and headers survive while authenticated responses stay uncacheable.
  if (hasSession(request) && response instanceof NextResponse) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
