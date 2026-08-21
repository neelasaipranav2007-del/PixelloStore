import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!userId && !sessionId) {
      return NextResponse.json({ success: true, cartItems: [] });
    }

    const where: any = {};
    if (userId) where.userId = userId;
    else if (sessionId) where.sessionId = sessionId;

    const items = await prisma.cartItem.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    const formatted = items.map((it) => {
      let photos = undefined;
      if (it.photos) {
        try {
          photos = JSON.parse(it.photos);
        } catch (e) {}
      }
      return {
        id: it.id,
        productId: it.productId,
        name: it.name,
        size: it.size,
        price: it.price,
        quantity: it.quantity,
        image: it.image,
        photos,
      };
    });

    return NextResponse.json({ success: true, cartItems: formatted });
  } catch (error: any) {
    console.error("Error fetching cart items:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, sessionId, productId, name, size, price, quantity, image, photos } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required cart item fields" }, { status: 400 });
    }

    const photosJson = photos && Array.isArray(photos) ? JSON.stringify(photos) : undefined;
    const existing = await prisma.cartItem.findFirst({
      where: {
        OR: [
          { id: id || "none" },
          {
            AND: [
              userId ? { userId } : { sessionId: sessionId || "guest" },
              { name },
              { size: size || "Standard" },
            ],
          },
        ],
      },
    });

    let result;
    if (existing) {
      result = await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (quantity || 1),
          photos: photosJson || existing.photos,
        },
      });
    } else {
      result = await prisma.cartItem.create({
        data: {
          id: id || undefined,
          userId,
          sessionId: sessionId || "guest",
          productId,
          name,
          size: size || "Standard",
          price: Number(price),
          quantity: quantity || 1,
          image: image || "/images/wooden_frame_main.png",
          photos: photosJson,
        },
      });
    }

    portalEvents.emit("cart_change", { action: "UPSERT", item: result });
    return NextResponse.json({ success: true, item: result });
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, delta, quantity } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Cart item id is required" }, { status: 400 });
    }

    let updated;
    if (quantity !== undefined) {
      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id } });
        return NextResponse.json({ success: true, deleted: true });
      }
      updated = await prisma.cartItem.update({
        where: { id },
        data: { quantity: Number(quantity) },
      });
    } else if (delta !== undefined) {
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        await prisma.cartItem.delete({ where: { id } });
        return NextResponse.json({ success: true, deleted: true });
      }
      updated = await prisma.cartItem.update({
        where: { id },
        data: { quantity: newQty },
      });
    }

    portalEvents.emit("cart_change", { action: "UPDATE", item: updated });
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (id) {
      await prisma.cartItem.deleteMany({ where: { id } });
    } else if (userId) {
      await prisma.cartItem.deleteMany({ where: { userId } });
    } else if (sessionId) {
      await prisma.cartItem.deleteMany({ where: { sessionId } });
    }

    portalEvents.emit("cart_change", { action: "DELETE", id, userId, sessionId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
