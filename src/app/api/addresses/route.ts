import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required to view addresses." }, { status: 401 });
    }

    const customerProfileId = user.customerProfile?.id;
    const addresses = customerProfileId
      ? await prisma.address.findMany({ where: { customerProfileId } })
      : [];
    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { userId, mobile, label, type, name, street, city, district, state, zipCode, pincode, phone } = body;

    const cleanMobile = (mobile || phone || "").replace(/\D/g, "").slice(-10);

    let user = authUser;
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            userId ? { id: userId } : {},
            cleanMobile ? { phone: `+91 ${cleanMobile}` } : {},
          ],
        },
        include: { customerProfile: true },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || "Customer",
          phone: cleanMobile ? `+91 ${cleanMobile}` : null,
          role: "CUSTOMER",
          customerProfile: { create: {} },
        },
        include: { customerProfile: true },
      });
    } else if (!user.customerProfile) {
      await prisma.customerProfile.create({
        data: { userId: user.id },
      });
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { customerProfile: true },
      });
    }

    const fullCity = [city, district, state].filter(Boolean).join(", ");
    const finalZip = zipCode || pincode || "500010";

    const createdAddress = await prisma.address.create({
      data: {
        customerProfileId: user!.customerProfile!.id,
        label: label || type || "Home",
        street: street || "Address Line",
        city: fullCity || "Hyderabad",
        state: state || "Telangana",
        zipCode: finalZip,
      },
    });

    return NextResponse.json({ success: true, address: createdAddress });
  } catch (error: any) {
    console.error("Error creating address:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
