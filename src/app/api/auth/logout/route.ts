import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set("pixello_auth_token", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: false,
    sameSite: "lax",
  });
  return response;
}
