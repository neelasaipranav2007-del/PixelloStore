import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  const cookieNames = ["pixello_auth_token", "pixello_customer_token", "pixello_token", "pixello_user"];
  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: false,
      sameSite: "lax",
    });
  }
  return response;
}
