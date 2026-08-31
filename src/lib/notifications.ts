import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export interface CreateNotificationParams {
  role: "ADMIN" | "STUDIO" | "DELIVERY" | "CUSTOMER" | "AMBASSADOR";
  userId?: string | null;
  type: string;
  title: string;
  message: string;
  referenceType?: "ORDER" | "PROMO" | "COMMISSION" | "REVIEW" | "PAYOUT" | null;
  referenceId?: string | null;
}

/**
 * Creates a real database notification in Prisma and broadcasts real-time SSE event.
 */
export async function createDatabaseNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        role: params.role,
        userId: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        referenceType: params.referenceType || null,
        referenceId: params.referenceId || null,
        isRead: false,
      },
    });

    // If Ambassador, also sync to AmbassadorNotification if profile exists
    if (params.role === "AMBASSADOR" && params.userId) {
      const ambProfile = await prisma.ambassadorProfile.findUnique({
        where: { userId: params.userId },
      });
      if (ambProfile) {
        await prisma.ambassadorNotification.create({
          data: {
            ambassadorProfileId: ambProfile.id,
            title: params.title,
            message: params.message,
            type: params.type,
            referenceId: params.referenceId || null,
            isRead: false,
          },
        }).catch(() => {});
      }
    }

    // Broadcast real-time SSE event across all portals
    portalEvents.emit("notification_change", {
      action: "CREATE",
      notification: {
        id: notification.id,
        role: notification.role,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        referenceType: notification.referenceType,
        referenceId: notification.referenceId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating database notification:", error);
    return null;
  }
}

/**
 * Get real database notifications for a specific portal/role or user.
 */
export async function getDatabaseNotifications(role?: string, userId?: string, limit = 50) {
  try {
    const where: any = {};
    if (role && role !== "ALL") {
      where.role = role.toUpperCase();
    }
    if (userId) {
      where.OR = [
        { userId },
        { role: role?.toUpperCase() || "CUSTOMER", userId: null },
      ];
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return { notifications, unreadCount };
  } catch (error) {
    console.error("Error fetching database notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }
}
