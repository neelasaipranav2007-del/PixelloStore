import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to update products." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.category !== undefined) dataToUpdate.categoryName = body.category;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.price !== undefined) dataToUpdate.basePrice = Number(body.price);
    if (body.originalPrice !== undefined) dataToUpdate.originalPrice = Number(body.originalPrice);
    if (body.badgeTag !== undefined) dataToUpdate.badgeTag = body.badgeTag;
    if (body.badge !== undefined) dataToUpdate.badge = body.badge;
    if (body.stock !== undefined) {
      dataToUpdate.stock = Number(body.stock);
      if (body.status === undefined) {
        dataToUpdate.status = Number(body.stock) === 0 ? "Out of Stock" : (Number(body.stock) <= 5 ? "Low Stock" : "Active");
      }
    }
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.images !== undefined) dataToUpdate.images = JSON.stringify(body.images);
    else if (body.image !== undefined) dataToUpdate.images = JSON.stringify([body.image]);
    if (body.frameSizes !== undefined) dataToUpdate.frameSizes = Array.isArray(body.frameSizes) ? JSON.stringify(body.frameSizes) : (body.frameSizes ? JSON.stringify(body.frameSizes) : null);
    if (body.frameColors !== undefined) dataToUpdate.frameColors = Array.isArray(body.frameColors) ? JSON.stringify(body.frameColors) : (body.frameColors ? JSON.stringify(body.frameColors) : null);
    if (body.polaroidSizes !== undefined) dataToUpdate.polaroidSizes = Array.isArray(body.polaroidSizes) ? JSON.stringify(body.polaroidSizes) : (body.polaroidSizes ? JSON.stringify(body.polaroidSizes) : null);
    if (body.variants !== undefined) dataToUpdate.variants = Array.isArray(body.variants) ? JSON.stringify(body.variants) : (body.variants ? JSON.stringify(body.variants) : "[]");
    if (body.aboutTitle !== undefined) dataToUpdate.aboutTitle = body.aboutTitle;
    if (body.aboutPoints !== undefined) dataToUpdate.aboutPoints = Array.isArray(body.aboutPoints) ? JSON.stringify(body.aboutPoints) : (body.aboutPoints ? JSON.stringify(body.aboutPoints) : null);

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    if (body.images !== undefined || body.image !== undefined) {
      import("@/lib/visualSearch").then(({ indexCatalogProducts }) => {
        indexCatalogProducts(false).catch(() => {});
      }).catch(() => {});
    }

    logAudit({
      userId: admin.user.id,
      actorRole: "ADMIN",
      action: "PRODUCT_UPDATED",
      targetId: id,
      details: dataToUpdate,
      req,
    }).catch(() => {});

    portalEvents.emit("product_change", { action: "UPDATE", product: updated });
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating product");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to delete products." },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    logAudit({
      userId: admin.user.id,
      actorRole: "ADMIN",
      action: "PRODUCT_DELETED",
      targetId: id,
      req,
    }).catch(() => {});

    portalEvents.emit("product_change", { action: "DELETE", productId: id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error deleting product");
  }
}
