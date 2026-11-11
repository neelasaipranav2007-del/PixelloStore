import { NextResponse } from "next/server";
import { revokeToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Extract token from request to record revocation
  const authHeader = req.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match =
      cookieHeader.match(/pixello_auth_token=([^;]+)/) ||
      cookieHeader.match(/pixello_admin_token=([^;]+)/) ||
      cookieHeader.match(/pixello_customer_token=([^;]+)/) ||
      cookieHeader.match(/pixello_ambassador_token=([^;]+)/) ||
      cookieHeader.match(/pixello_delivery_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    revokeToken(token);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  const cookieNames = [
    "pixello_auth_token",
    "pixello_customer_token",
    "pixello_admin_token",
    "pixello_ambassador_token",
    "pixello_delivery_token",
    "pixello_token",
    "pixello_user",
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
}
