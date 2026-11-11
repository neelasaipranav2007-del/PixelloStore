import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { createCustomerToken, getAuthenticatedAdmin } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rateLimit";
import { safeErrorResponse } from "@/lib/errorHandler";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to view customer directory." },
        { status: 401 }
      );
    }
    const statusSetting = await prisma.systemSetting.findUnique({
      where: { key: "customer_statuses" },
    });
    let statusMap: Record<string, string> = {};
    if (statusSetting?.value) {
      try {
        statusMap = JSON.parse(statusSetting.value);
      } catch (e) {}
    }

    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        customerProfileId: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Retrieve all users who are customers or have accounts (exclude dedicated system studio/delivery partners)
    const users = await prisma.user.findMany({
      where: {
        role: { notIn: ["STUDIO", "DELIVERY"] },
      },
      include: {
        customerProfile: {
          include: {
            addresses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const customerMap: Record<string, any> = {};

    // 1. Seed customer directory with database users
    users.forEach((u) => {
      const cleanMob = (u.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanMob) {
        const status = statusMap[u.id] || statusMap[cleanMob] || "Active";
        customerMap[cleanMob] = {
          id: u.id,
          name: u.name || "Customer",
          email: u.email || `${cleanMob}@pixello.store`,
          phone: u.phone || `+91 ${cleanMob}`,
          mobile: cleanMob,
          status,
          orderCount: 0,
          totalSpent: 0,
          createdAt: u.createdAt,
          addresses: u.customerProfile?.addresses || [],
          customerProfileId: u.customerProfile?.id,
        };
      }
    });

    // 2. Scan and aggregate orders (including any placed by guest phone numbers)
    allOrders.forEach((o) => {
      const cleanMob = (o.customerPhone || "").replace(/\D/g, "").slice(-10);
      if (cleanMob) {
        if (!customerMap[cleanMob]) {
          const status = statusMap[cleanMob] || "Active";
          customerMap[cleanMob] = {
            id: o.customerProfileId || `cust_${cleanMob}`,
            name: o.customerName || "Customer",
            email: `${cleanMob}@pixello.store`,
            phone: o.customerPhone.includes("+91") ? o.customerPhone : `+91 ${cleanMob}`,
            mobile: cleanMob,
            status,
            orderCount: 0,
            totalSpent: 0,
            createdAt: o.createdAt,
            addresses: [],
            customerProfileId: o.customerProfileId,
          };
        } else {
          // If the registered name was a placeholder but the order has a real name, use it
          if (
            (!customerMap[cleanMob].name ||
              customerMap[cleanMob].name === "Customer" ||
              customerMap[cleanMob].name.startsWith("Customer (")) &&
            o.customerName &&
            o.customerName !== "Customer"
          ) {
            customerMap[cleanMob].name = o.customerName;
          }
        }

        customerMap[cleanMob].orderCount += 1;
        customerMap[cleanMob].totalSpent += Number(o.totalAmount || 0);
      }
    });

    const formatted = Object.values(customerMap);

    return NextResponse.json({ success: true, customers: formatted, statusMap });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, mobile, password, college, birthday, termsAccepted } = body;

    const cleanMobile = (mobile || phone || "").replace(/\D/g, "").slice(-10);
    const cleanPhone = cleanMobile ? `+91 ${cleanMobile}` : undefined;

    if (!name || (!email && !cleanPhone)) {
      return NextResponse.json({ success: false, error: "Name and Email/Phone are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          cleanPhone ? { phone: cleanPhone } : {},
        ],
      },
    });

    if (!existingUser) {
      const isExplicitlyAccepted = termsAccepted === true || termsAccepted === "true";
      if (!isExplicitlyAccepted) {
        return NextResponse.json(
          { success: false, error: "Please accept the Terms & Conditions to continue." },
          { status: 400 }
        );
      }
    }

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name || existingUser.name,
          email: email || existingUser.email,
          phone: cleanPhone || existingUser.phone,
          password: password || existingUser.password,
        },
        include: { customerProfile: true },
      });
      portalEvents.emit("customer_change", { action: "UPDATE", user: updated });

      const token = createCustomerToken({
        userId: updated.id,
        role: updated.role,
        phone: updated.phone,
        email: updated.email,
        name: updated.name,
      });

      // Record terms acceptance
      try {
        await prisma.termsAcceptance.create({
          data: {
            userId: updated.id,
            version: "v1.0",
            policyVersion: "v1.0",
            context: "REGISTRATION",
            acceptedAt: new Date(),
          },
        });
      } catch (err) {}

      if (college !== undefined || birthday !== undefined) {
        try {
          const metaObj: Record<string, string> = {};
          if (college) metaObj.college = college.trim();
          if (birthday) metaObj.birthday = birthday.trim();
          await prisma.systemSetting.upsert({
            where: { key: `customer_meta_${updated.id}` },
            create: { key: `customer_meta_${updated.id}`, value: JSON.stringify(metaObj) },
            update: { value: JSON.stringify(metaObj) },
          });
        } catch (e) {}
      }

      const response = NextResponse.json({
        success: true,
        user: updated,
        token,
        customerProfileId: updated.customerProfile?.id,
        isNew: false,
      });

      response.cookies.set("pixello_auth_token", token, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });

      return response;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: cleanPhone || null,
        password: password || "pixello123",
        role: "CUSTOMER",
        customerProfile: {
          create: {},
        },
      },
      include: { customerProfile: true },
    });

    portalEvents.emit("customer_change", { action: "CREATE", user: newUser });

    // Record terms acceptance
    try {
      await prisma.termsAcceptance.create({
        data: {
          userId: newUser.id,
          version: "v1.0",
          policyVersion: "v1.0",
          context: "REGISTRATION",
          acceptedAt: new Date(),
        },
      });
    } catch (err) {}

    const token = createCustomerToken({
      userId: newUser.id,
      role: newUser.role,
      phone: newUser.phone,
      email: newUser.email,
      name: newUser.name,
    });

    if (college !== undefined || birthday !== undefined) {
      try {
        const metaObj: Record<string, string> = {};
        if (college) metaObj.college = college.trim();
        if (birthday) metaObj.birthday = birthday.trim();
        await prisma.systemSetting.upsert({
          where: { key: `customer_meta_${newUser.id}` },
          create: { key: `customer_meta_${newUser.id}`, value: JSON.stringify(metaObj) },
          update: { value: JSON.stringify(metaObj) },
        });
      } catch (e) {}
    }

    const response = NextResponse.json({
      success: true,
      user: newUser,
      token,
      customerProfileId: newUser.customerProfile?.id,
      isNew: true,
    });

    response.cookies.set("pixello_auth_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error registering customer");
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to update customer status." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, mobile, phone, status } = body;

    const cleanMob = (mobile || phone || "").replace(/\D/g, "").slice(-10);
    const targetKey = cleanMob || id;

    if (!targetKey || !status) {
      return NextResponse.json({ success: false, error: "Missing customer key or status" }, { status: 400 });
    }

    // Retrieve current statuses setting
    const existing = await prisma.systemSetting.findUnique({
      where: { key: "customer_statuses" },
    });

    let currentMap: Record<string, string> = {};
    if (existing?.value) {
      try {
        currentMap = JSON.parse(existing.value);
      } catch (e) {}
    }

    if (cleanMob) currentMap[cleanMob] = status;
    if (id) currentMap[id] = status;

    await prisma.systemSetting.upsert({
      where: { key: "customer_statuses" },
      create: {
        key: "customer_statuses",
        value: JSON.stringify(currentMap),
      },
      update: {
        value: JSON.stringify(currentMap),
      },
    });

    logAudit({
      userId: admin.user.id,
      actorRole: "ADMIN",
      action: "CUSTOMER_STATUS_CHANGED",
      targetId: targetKey,
      details: { status },
      req,
    }).catch(() => {});

    portalEvents.emit("customer_change", { action: "STATUS_CHANGE", key: targetKey, status });

    return NextResponse.json({ success: true, status, key: targetKey, statusMap: currentMap });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating customer status");
  }
}
