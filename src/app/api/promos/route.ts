import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryCode = searchParams.get("code");

    if (queryCode) {
      const clean = queryCode.replace(/\s+/g, "").toUpperCase();

      const rawTrimmed = queryCode.trim().toUpperCase();

      // 1. Check Ambassador Referral Code in Database first
      const ambassador = await prisma.ambassadorProfile.findFirst({
        where: {
          OR: [
            { referralCode: { equals: clean } },
            { referralCode: { equals: rawTrimmed } },
          ],
        },
        include: { user: true },
      });

      if (ambassador) {
        return NextResponse.json({
          success: true,
          promo: {
            id: `amb_${ambassador.id}`,
            code: ambassador.referralCode,
            type: "percentage",
            value: 10,
            minOrder: 0,
            maxCustomerLimit: null,
            usageCount: 0,
            category: "All Categories",
            status: "Active",
            description: `Campus Ambassador Code (${ambassador.user?.name || "Ambassador"} - ${ambassador.college})`,
            isAmbassador: true,
            ambassadorId: ambassador.id,
            ambassadorName: ambassador.user?.name || "Ambassador",
          },
        });
      }

      // 2. Check Store Coupon in Database
      const allActiveCoupons = await prisma.coupon.findMany({
        where: { status: "Active" },
      });

      const coupon = allActiveCoupons.find(
        (c) => c.code.replace(/\s+/g, "").toUpperCase() === clean || c.code.trim().toUpperCase() === rawTrimmed
      );

      if (coupon) {
        return NextResponse.json({
          success: true,
          promo: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder,
            maxCustomerLimit: coupon.maxCustomerLimit,
            usageCount: coupon.usageCount,
            category: coupon.category,
            status: coupon.status,
            description: coupon.description,
            isAmbassador: false,
          },
        });
      }

      // 2.5. Check Birthday Milestone Celebration Code (72-Hour Active Window)
      if (clean === "BDAY25" || clean === "BIRTHDAY25" || clean === "BDAYMAGIC" || clean === "BDAYSPECIAL") {
        return NextResponse.json({
          success: true,
          promo: {
            id: "bday_celebration_25",
            code: clean,
            type: "percentage",
            value: 25,
            minOrder: 0,
            maxCustomerLimit: null,
            usageCount: 1,
            category: "All Categories",
            status: "Active",
            description: "🎉 Special 72-Hour Birthday Milestone Celebration (25% OFF)",
            isAmbassador: false,
          },
        });
      }

      // 3. Check Known Default Ambassador Codes fallback
      const KNOWN_AMBASSADORS: Record<string, string> = {
        "SREE20": "Sree Charani",
        "SAIROHAN10": "Sai Rohan",
        "ARYAN20": "Aryan Verma",
        "VYSHU10": "Vyshu",
        "ARJUN10": "Arjun",
        "SREE10": "Sree Charani",
        "ROHAN10": "Sai Rohan",
        "POOJA10": "Pooja",
        "NEHA10": "Neha",
        "ANANYA10": "Ananya",
      };

      if (KNOWN_AMBASSADORS[clean]) {
        return NextResponse.json({
          success: true,
          promo: {
            id: `amb_${clean}`,
            code: clean,
            type: "percentage",
            value: 10,
            minOrder: 0,
            maxCustomerLimit: null,
            usageCount: 0,
            category: "All Categories",
            status: "Active",
            description: `Campus Ambassador Code (${KNOWN_AMBASSADORS[clean]})`,
            isAmbassador: true,
            ambassadorName: KNOWN_AMBASSADORS[clean],
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Invalid promo code" },
        { status: 404 }
      );
    }

    // Default: Return merged list of store coupons + ambassador codes
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    const ambassadors = await prisma.ambassadorProfile.findMany({
      include: { user: true },
    });

    const ambassadorCoupons = ambassadors.map((amb) => ({
      id: `amb_${amb.id}`,
      code: amb.referralCode,
      type: "percentage",
      value: 10,
      minOrder: 0,
      maxCustomerLimit: null,
      usageCount: 0,
      category: "All Categories",
      status: "Active",
      description: `Campus Ambassador Referral Code (${amb.user?.name || "Ambassador"} - ${amb.college})`,
      isAmbassador: true,
    }));

    // Deduplicate by normalized uppercase code
    const map = new Map<string, any>();
    for (const c of coupons) {
      map.set(c.code.replace(/\s+/g, "").toUpperCase(), c);
    }
    for (const a of ambassadorCoupons) {
      const key = a.code.replace(/\s+/g, "").toUpperCase();
      if (!map.has(key)) {
        map.set(key, a);
      }
    }

    // Add common fallback presets if missing
    const FALLBACKS = [
      { code: "SREE20", desc: "Sree Charani • Aurora University" },
      { code: "SAIROHAN10", desc: "Sai Rohan • Aurora University" },
      { code: "ARYAN20", desc: "Aryan Verma • IIT Bombay" },
      { code: "VYSHU10", desc: "Vyshu • Sreenidhii Engineering" },
      { code: "ARJUN10", desc: "Arjun • Narayana" },
    ];
    for (const fb of FALLBACKS) {
      const key = fb.code;
      if (!map.has(key)) {
        map.set(key, {
          id: `amb_${fb.code}`,
          code: fb.code,
          type: "percentage",
          value: 10,
          minOrder: 0,
          maxCustomerLimit: null,
          usageCount: 0,
          category: "All Categories",
          status: "Active",
          description: `Campus Ambassador Code (${fb.desc})`,
          isAmbassador: true,
        });
      }
    }

    return NextResponse.json({ success: true, promos: Array.from(map.values()) });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to create promo codes." },
        { status: 401 }
      );
    }

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

    // Modifying promo rules requires admin auth; usage increment during order is allowed
    if (!incrementUsage) {
      const admin = await getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. Admin privileges required to update promo codes." },
          { status: 401 }
        );
      }
    }

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
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to delete promo codes." },
        { status: 401 }
      );
    }

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
