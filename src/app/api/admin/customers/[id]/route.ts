import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

async function findCustomerWithFallback(identifier: string) {
  const cleanMob = identifier.replace(/\D/g, "").slice(-10);
  const cleanId = identifier.trim().toLowerCase();
  const suffix = identifier.replace(/^CUST-/i, "").trim().toLowerCase();

  // 1. Direct match by ID, full Phone, or Email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        cleanMob.length >= 10 ? { phone: { contains: cleanMob } } : {},
        { email: identifier },
        { customerProfile: { id: identifier } },
      ].filter((c) => Object.keys(c).length > 0),
    },
    include: {
      customerProfile: {
        include: {
          addresses: true,
        },
      },
      ambassadorProfile: true,
    },
  });

  // 2. Suffix scan across Prisma Users
  if (!user && suffix) {
    const allUsers = await prisma.user.findMany({
      include: {
        customerProfile: {
          include: {
            addresses: true,
          },
        },
        ambassadorProfile: true,
      },
    });
    user =
      allUsers.find(
        (u) =>
          u.id.toLowerCase().endsWith(suffix) ||
          (u.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanMob) ||
          u.id.toLowerCase() === cleanId
      ) || null;
  }

  // 3. Fallback: Search in Orders table directly if not in User table
  if (!user) {
    const matchedOrder = await prisma.order.findFirst({
      where: {
        OR: [
          cleanMob.length >= 10 ? { customerPhone: { contains: cleanMob } } : {},
          suffix ? { customerProfileId: { endsWith: suffix } } : {},
          { customerName: { contains: identifier } },
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (matchedOrder) {
      const matchedCleanPhone = matchedOrder.customerPhone.replace(/\D/g, "").slice(-10);
      return {
        id: matchedOrder.customerProfileId || `CUST-${matchedCleanPhone.slice(-4) || "0001"}`,
        displayId: `CUST-${matchedCleanPhone.slice(-4) || "0001"}`,
        name: matchedOrder.customerName,
        email: `${matchedCleanPhone}@pixello.store`,
        phone: matchedOrder.customerPhone,
        mobile: matchedCleanPhone,
        role: "CUSTOMER",
        createdAt: matchedOrder.createdAt,
        customerProfile: {
          id: matchedOrder.customerProfileId || "profile-gen",
          addresses: [],
        },
      };
    }
  }

  if (user) {
    const userPhoneClean = (user.phone || "").replace(/\D/g, "").slice(-10);
    return {
      id: user.id,
      displayId: `CUST-${user.id.slice(-4)}`,
      name: user.name || "Customer",
      email: user.email || (userPhoneClean ? `${userPhoneClean}@pixello.store` : "Not available"),
      phone: user.phone || (userPhoneClean ? `+91 ${userPhoneClean}` : "Not available"),
      mobile: userPhoneClean,
      role: user.role,
      createdAt: user.createdAt,
      customerProfile: user.customerProfile,
    };
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const identifier = decodeURIComponent(rawId || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Customer ID or identifier is required." },
        { status: 400 }
      );
    }

    // Locate customer user from Prisma
    const user = await findCustomerWithFallback(identifier);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    const userPhoneClean = (user.phone || "").replace(/\D/g, "").slice(-10);

    // Fetch all orders for this customer from Prisma
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          user.customerProfile?.id ? { customerProfileId: user.customerProfile.id } : {},
          userPhoneClean ? { customerPhone: { contains: userPhoneClean } } : {},
          user.email ? { customerPhone: user.email } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute Customer Statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completedOrders = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "REFUNDED"
    ).length;
    const pendingOrders = totalOrders - completedOrders - cancelledOrders;

    // Retrieve saved status override if any
    const statusSetting = await prisma.systemSetting.findUnique({
      where: { key: "customer_statuses" },
    });
    let statusMap: Record<string, string> = {};
    if (statusSetting?.value) {
      try {
        statusMap = JSON.parse(statusSetting.value);
      } catch (e) {}
    }

    const customStatus =
      statusMap[user.id] ||
      (userPhoneClean ? statusMap[userPhoneClean] : null) ||
      "Active";

    // Format Addresses
    const addresses = user.customerProfile?.addresses || [];
    let primaryAddressStr = "Not available";

    if (addresses.length > 0) {
      const primary = addresses[0];
      primaryAddressStr = `${primary.street}, ${primary.city}, ${primary.state} - ${primary.zipCode}`.replace(
        /^,\s*/,
        ""
      );
    } else if (orders.length > 0 && orders[0].shippingAddress) {
      primaryAddressStr = orders[0].shippingAddress;
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: user.id,
        displayId: user.displayId,
        name: user.name || "Customer",
        email: user.email || (userPhoneClean ? `${userPhoneClean}@pixello.store` : "Not available"),
        phone: user.phone || (userPhoneClean ? `+91 ${userPhoneClean}` : "Not available"),
        mobile: userPhoneClean || "Not available",
        role: user.role,
        status: customStatus,
        createdAt: typeof user.createdAt === "string" ? user.createdAt : user.createdAt.toISOString(),
        registrationDate: new Date(user.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        primaryAddress: primaryAddressStr,
        addresses: addresses.map((a: any) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          country: a.country || "India",
        })),
        stats: {
          totalOrders,
          totalSpent,
          completedOrders,
          pendingOrders,
          cancelledOrders,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load customer profile." },
      { status: 500 }
    );
  }
}
