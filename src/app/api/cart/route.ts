import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
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

    // IDOR Protection: Customers cannot inspect other users' carts
    let targetUserId = userId;
    if (authUser) {
      targetUserId = authUser.id;
    } else if (userId && !admin) {
      targetUserId = undefined;
    }

    if (!targetUserId && !sessionId) {
      return NextResponse.json({ success: true, cartItems: [] });
    }

    const where: any = {};
    if (targetUserId) where.userId = targetUserId;
    else if (sessionId) where.sessionId = sessionId;

    const items = await prisma.cartItem.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    const formatted = items.map((it) => {
      let photos = undefined;
      let isHamper = false;
      let hamperData = undefined;
      let frameCustomization = undefined;
      let customizationDetails = undefined;
      if (it.photos) {
        try {
          const parsed = JSON.parse(it.photos);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            isHamper = !!parsed.isHamper;
            hamperData = parsed.hamperData;
            frameCustomization = parsed.frameCustomization;
            customizationDetails = parsed.customizationDetails;
            photos = parsed.photos;
          } else if (Array.isArray(parsed)) {
            photos = parsed;
          }
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
        isHamper: isHamper || it.name.toLowerCase().includes("hamper"),
        hamperData,
        frameCustomization,
        customizationDetails,
      };
    });

    return NextResponse.json({ success: true, cartItems: formatted });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching cart items");
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { id, userId, sessionId, productId, name, size, price, quantity, image, photos, isHamper, hamperData, frameCustomization, customizationDetails } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required cart item fields" }, { status: 400 });
    }

    const targetUserId = authUser ? authUser.id : (userId || undefined);

    let photosJson: string | undefined = undefined;
    if (isHamper || hamperData || frameCustomization || customizationDetails) {
      photosJson = JSON.stringify({
        isHamper: !!isHamper || !!hamperData,
        hamperData: hamperData || null,
        frameCustomization: frameCustomization || null,
        customizationDetails: customizationDetails || null,
        photos: Array.isArray(photos) ? photos : [],
      });
    } else if (photos && Array.isArray(photos)) {
      photosJson = JSON.stringify(photos);
    }
    const existing = await prisma.cartItem.findFirst({
      where: {
        OR: [
          { id: id || "none" },
          {
            AND: [
              targetUserId ? { userId: targetUserId } : { sessionId: sessionId || "guest" },
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
          userId: targetUserId,
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
    return safeErrorResponse(error, 500, "Error adding to cart");
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
    return safeErrorResponse(error, 500, "Error updating cart");
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    const authUser = await getAuthenticatedUser(req);
    const admin = await getAuthenticatedAdmin(req);

    if (userId && authUser && authUser.id !== userId && !admin) {
      return NextResponse.json({ success: false, error: "Forbidden. You cannot clear another user's cart." }, { status: 403 });
    }

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
    return safeErrorResponse(error, 500, "Error clearing cart");
  }
}
