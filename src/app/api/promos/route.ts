import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, promos: coupons });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, type, value, minOrder, maxCustomerLimit, category, status, description } = body;

    if (!code || !value) {
      return NextResponse.json(
        { success: false, error: "Missing promo code or value" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const limitVal = maxCustomerLimit === "" || maxCustomerLimit === null || maxCustomerLimit === undefined ? null : Number(maxCustomerLimit);

    const created = await prisma.coupon.upsert({
      where: { code: cleanCode },
      update: {
        type: type || "percentage",
        value: Number(value) || 0,
        minOrder: Number(minOrder) || 0,
        maxCustomerLimit: limitVal,
        category: category || "All Categories",
        status: status || "Active",
        description: description || "",
      },
      create: {
        code: cleanCode,
        type: type || "percentage",
        value: Number(value) || 0,
        minOrder: Number(minOrder) || 0,
        maxCustomerLimit: limitVal,
        category: category || "All Categories",
        status: status || "Active",
        description: description || "",
      },
    });

    portalEvents.emit("promo_change", { action: "CREATE", promo: created });

    return NextResponse.json({ success: true, promo: created });
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, code, type, value, minOrder, maxCustomerLimit, category, status, description, incrementUsage } = body;

    if (!id && !code) {
      return NextResponse.json({ success: false, error: "Missing promo ID or code" }, { status: 400 });
    }

    const cleanCode = code ? code.trim().toUpperCase() : undefined;
    let updated: any = null;

    if (incrementUsage) {
      try {
        if (id) {
          updated = await prisma.coupon.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
          });
        } else if (cleanCode) {
          updated = await prisma.coupon.update({
            where: { code: cleanCode },
            data: { usageCount: { increment: 1 } },
          });
        }
      } catch (e) {
        if (cleanCode) {
          try {
            await prisma.coupon.updateMany({
              where: { code: cleanCode },
              data: { usageCount: { increment: 1 } },
            });
          } catch (e2) {}
        }
      }
    } else {
      const dataToSet: any = {
        code: cleanCode,
        type,
        value: value !== undefined ? Number(value) : undefined,
        minOrder: minOrder !== undefined ? Number(minOrder) : undefined,
        maxCustomerLimit: maxCustomerLimit === "" || maxCustomerLimit === null ? null : Number(maxCustomerLimit),
        category,
        status,
        description,
      };

      try {
        if (id) {
          updated = await prisma.coupon.update({
            where: { id },
            data: dataToSet,
          });
        } else if (cleanCode) {
          updated = await prisma.coupon.update({
            where: { code: cleanCode },
            data: dataToSet,
          });
        }
      } catch (e) {
        if (cleanCode) {
          try {
            await prisma.coupon.updateMany({
              where: { code: cleanCode },
              data: dataToSet,
            });
          } catch (e2) {}
        }
      }
    }

    portalEvents.emit("promo_change", { action: "UPDATE", promo: updated });
    portalEvents.emit("promo_update", { action: "UPDATE", promo: updated });

    return NextResponse.json({ success: true, promo: updated });
  } catch (error: any) {
    console.error("Error updating promo code:", error);
    return NextResponse.json({ success: true, warning: error.message });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const code = searchParams.get("code");

    if (!id && !code) {
      return NextResponse.json({ success: false, error: "Missing promo ID or code" }, { status: 400 });
    }

    try {
      if (id) {
        await prisma.coupon.delete({
          where: { id },
        });
      } else if (code) {
        await prisma.coupon.deleteMany({
          where: { code: code.toUpperCase() },
        });
      }
    } catch (dbErr) {
      // If direct delete fails, try deleteMany by code or ignore if already gone
      if (code) {
        try {
          await prisma.coupon.deleteMany({
            where: { code: code.toUpperCase() },
          });
        } catch (e) {}
      }
    }

    portalEvents.emit("promo_change", { action: "DELETE", id, code });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json({ success: true, warning: error.message });
  }
}
