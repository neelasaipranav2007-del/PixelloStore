import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador } = auth;

    const notifications = await prisma.ambassadorNotification.findMany({
      where: { ambassadorProfileId: ambassador.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador } = auth;
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.ambassadorNotification.updateMany({
        where: { ambassadorProfileId: ambassador.id },
        data: { isRead: true },
      });
    } else if (notificationId) {
      await prisma.ambassadorNotification.updateMany({
        where: {
          id: notificationId,
          ambassadorProfileId: ambassador.id, // Strictly scoped!
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, message: "Notifications updated." });
  } catch (error: any) {
    console.error("PATCH /api/ambassador/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
