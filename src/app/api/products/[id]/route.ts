import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    if (body.frameSizes !== undefined) dataToUpdate.frameSizes = JSON.stringify(body.frameSizes);
    if (body.frameColors !== undefined) dataToUpdate.frameColors = JSON.stringify(body.frameColors);
    if (body.polaroidSizes !== undefined) dataToUpdate.polaroidSizes = JSON.stringify(body.polaroidSizes);
    if (body.variants !== undefined) dataToUpdate.variants = JSON.stringify(body.variants);

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    portalEvents.emit("product_change", { action: "UPDATE", product: updated });
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    portalEvents.emit("product_change", { action: "DELETE", id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
