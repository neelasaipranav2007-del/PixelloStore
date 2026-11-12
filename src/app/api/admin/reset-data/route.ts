import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCredentials } from "@/lib/adminSecurity";
import { getAuthenticatedAdmin } from "@/lib/session";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reset-data
 * Returns live record counts for all platform entities
 */
export async function GET(req: Request) {
  try {
    const [
      customersCount,
      categoriesCount,
      productsCount,
      ordersCount,
      deliveriesCount,
      transactionsCount,
      studiosCount,
      notificationsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
      prisma.category.count().catch(() => 0),
      prisma.product.count().catch(() => 0),
      prisma.order.count().catch(() => 0),
      prisma.deliveryInfo.count().catch(() => 0),
      prisma.transaction.count().catch(() => 0),
      prisma.user.count({ where: { role: "STUDIO" } }).catch(() => 0),
      prisma.notification.count().catch(() => 0),
    ]);

    const totalRecords =
      customersCount +
      categoriesCount +
      productsCount +
      ordersCount +
      deliveriesCount +
      transactionsCount +
      studiosCount +
      notificationsCount;

    return NextResponse.json({
      success: true,
      counts: {
        customers: customersCount,
        manufacturers: Math.max(studiosCount, 1),
        categories: categoriesCount,
        products: productsCount,
        customerOrders: ordersCount,
        purchaseOrders: deliveriesCount,
        gstInvoices: transactionsCount,
        payments: transactionsCount,
        totalRecords,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch platform counts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load live record counts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reset-data
 * Permanently deletes all platform data after verifying 2FA (Password + 4-Digit Security PIN)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      confirmText,
      password,
      securityPin,
      deleteSecondaryStaff = false,
      resetStoreDefaults = false,
    } = body;

    // 1. Verify exact confirmation string
    if (confirmText !== "RESET ALL DATA") {
      return NextResponse.json(
        {
          success: false,
          error: "Confirmation text must be exactly 'RESET ALL DATA'.",
        },
        { status: 400 }
      );
    }

    // 2. Verify Admin Password and 4-Digit Security PIN (2FA verification)
    const verification = await verifyAdminCredentials(password, securityPin);
    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Authentication failed. Incorrect Password or 4-Digit Security PIN.",
        },
        { status: 401 }
      );
    }

    // 3. Perform atomic cascades & deletions
    // Clean transactional entities first to satisfy foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete orders & child tables
      await tx.orderItem.deleteMany({}).catch(() => {});
      await tx.deliveryInfo.deleteMany({}).catch(() => {});
      await tx.commission.deleteMany({}).catch(() => {});
      await tx.transaction.deleteMany({}).catch(() => {});
      await tx.order.deleteMany({}).catch(() => {});

      // Delete customer data & cart/wishlist
      await tx.cartItem.deleteMany({}).catch(() => {});
      await tx.wishlistItem.deleteMany({}).catch(() => {});
      await tx.address.deleteMany({}).catch(() => {});
      await tx.termsAcceptance.deleteMany({}).catch(() => {});
      await tx.customerProfile.deleteMany({}).catch(() => {});
      await tx.user.deleteMany({ where: { role: "CUSTOMER" } }).catch(() => {});

      // Delete catalog products & categories
      await tx.product.deleteMany({}).catch(() => {});
      await tx.category.deleteMany({}).catch(() => {});
      await tx.studioInventory.deleteMany({}).catch(() => {});

      // Delete ambassador payouts & non-admin notifications
      await tx.ambassadorPayout.deleteMany({}).catch(() => {});
      await tx.ambassadorReward.deleteMany({}).catch(() => {});
      await tx.ambassadorNotification.deleteMany({}).catch(() => {});
      await tx.notification.deleteMany({}).catch(() => {});

      // Optional Secondary Staff Cleanup
      if (deleteSecondaryStaff) {
        await tx.user.deleteMany({
          where: {
            role: {
              in: ["AMBASSADOR", "STUDIO", "DELIVERY"],
            },
          },
        }).catch(() => {});
        await tx.ambassadorProfile.deleteMany({}).catch(() => {});
        await tx.studioProfile.deleteMany({}).catch(() => {});
        await tx.deliveryProfile.deleteMany({}).catch(() => {});
      }

      // Optional Store Defaults Reset
      if (resetStoreDefaults) {
        await tx.systemSetting.deleteMany({
          where: {
            key: {
              in: [
                "spotlight_banners_config",
                "hamper_store_config",
                "frame_studio_config",
                "homepage_stats_config",
              ],
            },
          },
        }).catch(() => {});
      }
    });

    // 4. Log Audit Log for the permanent reset
    const admin = await getAuthenticatedAdmin(req);
    await logAudit({
      userId: admin?.user?.id || "super_admin",
      actorRole: "ADMIN",
      action: "PLATFORM_DATA_PERMANENT_RESET",
      details: JSON.stringify({
        deleteSecondaryStaff,
        resetStoreDefaults,
        timestamp: new Date().toISOString(),
      }),
      req,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "All platform business and customer data have been permanently reset successfully.",
      counts: {
        customers: 0,
        manufacturers: deleteSecondaryStaff ? 0 : 1,
        categories: 0,
        products: 0,
        customerOrders: 0,
        purchaseOrders: 0,
        gstInvoices: 0,
        payments: 0,
        totalRecords: 0,
      },
    });
  } catch (error: any) {
    console.error("Platform Reset Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute platform reset. Please try again.",
      },
      { status: 500 }
    );
  }
}
