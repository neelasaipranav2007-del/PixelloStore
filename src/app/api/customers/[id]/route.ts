import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";
import { logAudit } from "@/lib/auditLogger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAuthenticatedAdmin(req);
    const authUser = await getAuthenticatedUser(req);

    if (!admin && !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required to view profile." },
        { status: 401 }
      );
    }

    // Ownership check (IDOR Protection)
    const cleanUserPhone = (authUser?.phone || "").replace(/\D/g, "").slice(-10);
    const cleanReqId = id.replace(/\D/g, "").slice(-10);
    const isOwner =
      authUser &&
      (authUser.id === id ||
        authUser.email === id ||
        (cleanUserPhone && cleanUserPhone === cleanReqId));

    if (!admin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You cannot view other customers' profiles." },
        { status: 403 }
      );
    }

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
    return safeErrorResponse(error, 500, "Error fetching customer");
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await getAuthenticatedAdmin(req);
    const authUser = await getAuthenticatedUser(req);

    if (!admin && !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required to update profile." },
        { status: 401 }
      );
    }

    // Ownership check (IDOR Protection)
    const cleanUserPhone = (authUser?.phone || "").replace(/\D/g, "").slice(-10);
    const cleanReqId = id.replace(/\D/g, "").slice(-10);
    const isOwner =
      authUser &&
      (authUser.id === id ||
        authUser.email === id ||
        (cleanUserPhone && cleanUserPhone === cleanReqId));

    if (!admin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You cannot modify other customers' profiles." },
        { status: 403 }
      );
    }

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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { email: id },
          { phone: id },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    logAudit({
      userId: authUser?.id || admin?.user?.id,
      actorRole: admin ? "ADMIN" : "CUSTOMER",
      action: "CUSTOMER_PROFILE_UPDATED",
      targetId: user.id,
      details: { updatedFields: Object.keys(dataToUpdate) },
      req,
    }).catch(() => {});

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating customer");
  }
}
