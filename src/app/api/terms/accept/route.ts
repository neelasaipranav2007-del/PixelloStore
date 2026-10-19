import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { CURRENT_TERMS_VERSION, CURRENT_POLICY_VERSION } from "@/lib/termsData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const targetUserId = userIdParam || authUser?.id;
    const version = searchParams.get("version") || CURRENT_TERMS_VERSION;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "userId is required or session must be active" }, { status: 400 });
    }

    const record = await prisma.termsAcceptance.findFirst({
      where: { userId: targetUserId, version },
      orderBy: { acceptedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      accepted: !!record,
      version,
      acceptedAt: record?.acceptedAt ?? null,
      context: record?.context ?? null,
      policyVersion: record?.policyVersion ?? CURRENT_POLICY_VERSION,
    });
  } catch (error: any) {
    console.error("Error in GET /api/terms/accept:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { 
      userId, 
      version = CURRENT_TERMS_VERSION, 
      policyVersion = CURRENT_POLICY_VERSION, 
      context = "REGISTRATION", 
      orderId 
    } = body;

    const targetUserId = userId || authUser?.id;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "userId is required or session must be active" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const record = await prisma.termsAcceptance.create({
      data: {
        userId: targetUserId,
        version,
        policyVersion,
        context,
        orderId: orderId ?? null,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, accepted: true, record });
  } catch (error: any) {
    console.error("Error in POST /api/terms/accept:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
