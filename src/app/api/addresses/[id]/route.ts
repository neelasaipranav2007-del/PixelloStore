import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";
import { sanitizeText } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAuthenticatedAdmin(req);
    const authUser = await getAuthenticatedUser(req);

    if (!admin && !authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update address." },
        { status: 401 }
      );
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
      include: { customerProfile: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    if (!admin && existing.customerProfile?.userId !== authUser?.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You cannot modify another customer's address." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { label, type, street, city, state, zipCode, pincode } = body;

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label || type ? { label: sanitizeText(label || type, 50) } : {}),
        ...(street !== undefined ? { street: sanitizeText(street, 200) } : {}),
        ...(city !== undefined ? { city: sanitizeText(city, 100) } : {}),
        ...(state !== undefined ? { state: sanitizeText(state, 100) } : {}),
        ...(zipCode || pincode ? { zipCode: String(zipCode || pincode).trim().slice(0, 10) } : {}),
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating address");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAuthenticatedAdmin(req);
    const authUser = await getAuthenticatedUser(req);

    if (!admin && !authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete address." },
        { status: 401 }
      );
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
      include: { customerProfile: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    if (!admin && existing.customerProfile?.userId !== authUser?.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You cannot delete another customer's address." },
        { status: 403 }
      );
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error deleting address");
  }
}
