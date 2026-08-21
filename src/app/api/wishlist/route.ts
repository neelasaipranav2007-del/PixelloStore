import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!userId && !sessionId) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const where: any = {};
    if (userId) where.userId = userId;
    else if (sessionId) where.sessionId = sessionId;

    const items = await prisma.wishlistItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, wishlist: items });
  } catch (error: any) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, sessionId, productId, name, category, price, image } = body;

    const targetProductId = productId || id || "PRD-01";
    const targetUserId = userId || undefined;
    const targetSessionId = (!userId ? (sessionId || "guest") : undefined);

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
        price: Number(price || 499),
        image: image || "/images/wooden_frame_main.png",
      },
    });

    return NextResponse.json({ success: true, inWishlist: true, item: created, action: "ADDED" });
  } catch (error: any) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const productId = searchParams.get("productId");

    if (id) {
      await prisma.wishlistItem.deleteMany({ where: { id } });
    } else if (userId && productId) {
      await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
