import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const commissions = await prisma.commission.findMany({
      include: {
        order: {
          include: {
            items: true,
          },
        },
        ambassadorProfile: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ambassadors = await prisma.ambassadorProfile.findMany({
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      commissions,
      ambassadors,
    });
  } catch (error: any) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
