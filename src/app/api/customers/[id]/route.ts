import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { email: id },
          { phone: id },
          { phone: `+91 ${id}` },
        ],
      },
      include: {
        customerProfile: {
          include: {
            addresses: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, mobile, password, image } = body;

    const cleanMobile = (mobile || phone || "").replace(/\D/g, "").slice(-10);
    const cleanPhone = cleanMobile ? `+91 ${cleanMobile}` : undefined;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (cleanPhone !== undefined) dataToUpdate.phone = cleanPhone;
    if (password !== undefined) dataToUpdate.password = password;
    if (image !== undefined) dataToUpdate.image = image;

    // Match by ID, email, or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { email: id },
          { phone: id },
          { phone: `+91 ${id}` },
        ],
      },
    });

    let updated;
    if (user) {
      updated = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
        include: { customerProfile: true },
      });
    } else {
      updated = await prisma.user.create({
        data: {
          name: name || "Customer",
          email: email || null,
          phone: cleanPhone || null,
          password: password || "pixello123",
          role: "CUSTOMER",
          customerProfile: { create: {} },
        },
        include: { customerProfile: true },
      });
    }

    portalEvents.emit("customer_change", { action: "UPDATE", user: updated });
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
