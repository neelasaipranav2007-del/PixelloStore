import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { label, type, street, city, state, zipCode, pincode } = body;

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label: label || type,
        street,
        city,
        state,
        zipCode: zipCode || pincode,
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error: any) {
    console.error("Error updating address:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
