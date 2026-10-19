import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protect Customer Portal routes (/profile and any subroutes)
  if (pathname.startsWith("/profile")) {
    const token = request.cookies.get("pixello_auth_token")?.value;

    // If token is completely missing or clearly malformed, redirect to /login preserving destination
    if (!token || !token.includes(".")) {
      const redirectUrl = new URL("/login", request.url);
      const fullDestination = pathname + search;
      redirectUrl.searchParams.set("redirect", fullDestination);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/profile"],
};
