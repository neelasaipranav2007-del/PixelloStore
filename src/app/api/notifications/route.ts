import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createDatabaseNotification, getDatabaseNotifications } from "@/lib/notifications";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "CUSTOMER";
    const userId = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const data = await getDatabaseNotifications(role, userId, limit);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, userId, type, title, message, referenceType, referenceId } = body;

    if (!role || !type || !title || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const notification = await createDatabaseNotification({
      role,
      userId,
      type,
      title,
      message,
      referenceType,
      referenceId,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, markAll, role, userId } = body;

    if (markAll) {
      const where: any = {};
      if (role && role !== "ALL") where.role = role.toUpperCase();
      if (userId) where.userId = userId;

      await prisma.notification.updateMany({
        where: {
          ...where,
          isRead: false,
        },
        data: { isRead: true },
      });

      portalEvents.emit("notification_change", { action: "READ_ALL", role, userId });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      portalEvents.emit("notification_change", { action: "READ", id, notification: updated });
      return NextResponse.json({ success: true, notification: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");
    const userId = searchParams.get("userId");

    if (id) {
      await prisma.notification.delete({ where: { id } }).catch(() => {});
      portalEvents.emit("notification_change", { action: "DELETE", id });
      return NextResponse.json({ success: true, message: "Notification deleted." });
    }

    const where: any = {};
    if (role && role !== "ALL") where.role = role.toUpperCase();
    if (userId) where.userId = userId;

    await prisma.notification.deleteMany({ where }).catch(() => {});
    portalEvents.emit("notification_change", { action: "CLEAR", role, userId });
    return NextResponse.json({ success: true, message: "Notifications cleared." });
  } catch (error: any) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
