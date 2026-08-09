import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  const path = request.nextUrl.pathname;

  if (path.startsWith("/auth")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  if (path.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  if (request.method === "GET" && !path.startsWith("/api")) {
    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/admin") ||
      path.startsWith("/messages") ||
      path.startsWith("/notifications")
    ) {
      response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
    } else {
      response.headers.set(
        "Cache-Control",
        "public, max-age=3600, stale-while-revalidate=86400"
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
