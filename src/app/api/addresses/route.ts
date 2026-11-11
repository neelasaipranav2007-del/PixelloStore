import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";
import { sanitizeText, isValidPincode } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    const user = await getAuthenticatedUser(req);

    if (!admin && !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view addresses." },
        { status: 401 }
      );
    }

    const customerProfileId = user?.customerProfile?.id;
    const addresses = customerProfileId
      ? await prisma.address.findMany({ where: { customerProfileId } })
      : [];

    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching addresses");
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to save addresses." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { label, type, name, street, city, district, state, zipCode, pincode } = body;

    let customerProfileId = authUser.customerProfile?.id;
    if (!customerProfileId) {
      const profile = await prisma.customerProfile.create({
        data: { userId: authUser.id },
      });
      customerProfileId = profile.id;
    }

    const code = zipCode || pincode || "500079";
    const newAddress = await prisma.address.create({
      data: {
        customerProfileId,
        label: sanitizeText(label || type || "Home", 50),
        street: sanitizeText(street || "", 200),
        city: sanitizeText(city || district || "Hyderabad", 100),
        state: sanitizeText(state || "Telangana", 100),
        zipCode: String(code).trim().slice(0, 10),
      },
    });

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error saving address");
  }
}
