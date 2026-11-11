import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://docs.google.com",
    "frame-src 'self' https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; "),
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

/**
 * Validates basic structure of signed token in Edge Middleware
 */
function isValidTokenFormat(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const raw = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(raw);
    if (!payload.userId || !payload.issuedAt) return false;
    // Expire after 30 days
    if (Date.now() - payload.issuedAt > 30 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

function getDecodedPayload(token?: string | null): any {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const raw = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Protect Customer Portal routes (/profile and subroutes)
  if (pathname.startsWith("/profile")) {
    const token =
      request.cookies.get("pixello_auth_token")?.value ||
      request.cookies.get("pixello_customer_token")?.value;

    if (!isValidTokenFormat(token)) {
      const redirectUrl = new URL("/login", request.url);
      const fullDestination = pathname + search;
      redirectUrl.searchParams.set("redirect", fullDestination);
      const res = NextResponse.redirect(redirectUrl);
      return applySecurityHeaders(res);
    }
  }

  // 2. Protect Admin Portal routes (/admin and subroutes, excluding /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken =
      request.cookies.get("pixello_admin_token")?.value ||
      request.cookies.get("pixello_auth_token")?.value;

    const payload = getDecodedPayload(adminToken);
    const hasAdminRole = payload && (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN");

    if (!isValidTokenFormat(adminToken) || !hasAdminRole) {
      const redirectUrl = new URL("/admin/login", request.url);
      const res = NextResponse.redirect(redirectUrl);
      return applySecurityHeaders(res);
    }
  }

  // 3. Protect Delivery Portal routes (/delivery/dashboard, /delivery/tasks)
  if (
    pathname.startsWith("/delivery/") &&
    pathname !== "/delivery" &&
    pathname !== "/delivery/login"
  ) {
    const delToken =
      request.cookies.get("pixello_delivery_token")?.value ||
      request.cookies.get("pixello_auth_token")?.value ||
      request.cookies.get("pixello_admin_token")?.value;

    const payload = getDecodedPayload(delToken);
    const hasDeliveryRole =
      payload &&
      (payload.role === "DELIVERY" || payload.role === "ADMIN" || payload.role === "SUPER_ADMIN");

    if (!isValidTokenFormat(delToken) || !hasDeliveryRole) {
      const redirectUrl = new URL("/delivery", request.url);
      const res = NextResponse.redirect(redirectUrl);
      return applySecurityHeaders(res);
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, public files
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|icons/).*)",
  ],
};
