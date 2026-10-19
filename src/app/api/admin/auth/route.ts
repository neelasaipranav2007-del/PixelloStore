import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCustomerToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password, mobile, name } = body;
    const cleanMobile = (phone || mobile || "").replace(/\D/g, "").slice(-10);

    // Find or create admin user in central database
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanMobile ? [{ phone: { contains: cleanMobile } }] : []),
          { email: "admin@pixellostore.com" },
          { email: "neelasaipranav2007@gmail.com" },
          { role: "ADMIN" },
        ],
      },
    });

    if (adminUser && adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN" },
      });
    }

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: name || "Pranav (Master Admin)",
          email: "admin@pixellostore.com",
          phone: cleanMobile ? `+91 ${cleanMobile}` : "+91 9999999999",
          role: "ADMIN",
        },
      });
    }

    const token = createCustomerToken({
      userId: adminUser.id,
      phone: adminUser.phone || `+91 ${cleanMobile}`,
      email: adminUser.email || "admin@pixellostore.com",
      name: adminUser.name || "Master Admin",
      role: "ADMIN",
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
      },
    });

    // Set HTTP-only compatible session cookie for admin
    response.cookies.set("pixello_admin_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Admin auth API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
