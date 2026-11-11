import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;

    const authUser = await getAuthenticatedUser(req);
    const admin = await getAuthenticatedAdmin(req);

    // IDOR Protection: lock targetUserId to authUser if logged in
    let targetUserId = userId;
    if (authUser) {
      targetUserId = authUser.id;
    } else if (userId && !admin) {
      targetUserId = undefined;
    }

    if (!targetUserId && !sessionId) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const where: any = {};
    if (targetUserId) where.userId = targetUserId;
    else if (sessionId) where.sessionId = sessionId;

    const items = await prisma.wishlistItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, wishlist: items });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching wishlist");
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { id, userId, sessionId, productId, name, category, price, image } = body;

    const targetProductId = productId || id || "PRD-01";
    const targetUserId = authUser ? authUser.id : (userId || undefined);
    const targetSessionId = !targetUserId ? (sessionId || "guest") : undefined;

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        AND: [
          targetUserId ? { userId: targetUserId } : { sessionId: targetSessionId },
          { OR: [{ productId: targetProductId }, { id: targetProductId }] },
        ],
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, inWishlist: false, action: "REMOVED" });
    }

    const created = await prisma.wishlistItem.create({
      data: {
        userId: targetUserId,
        sessionId: targetSessionId,
        productId: targetProductId,
        name: name || "Custom Frame",
        category: category || "Frames",
        price: Number(price) || 0,
        image: image || "/images/wooden_frame_main.png",
      },
    });

    return NextResponse.json({ success: true, inWishlist: true, action: "ADDED", item: created });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating wishlist");
  }
}
