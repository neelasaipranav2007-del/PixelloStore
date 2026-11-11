import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    const admin = await getAuthenticatedAdmin(req);

    if (!auth && !admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Ambassador or Admin privileges required." },
        { status: 401 }
      );
    }

    // IDOR / Data Ownership filter: Ambassadors see ONLY their own commissions
    const whereClause: any = {};
    if (!admin && auth?.ambassador) {
      whereClause.ambassadorProfileId = auth.ambassador.id;
    }

    const commissions = await prisma.commission.findMany({
      where: whereClause,
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

    const ambassadors = admin
      ? await prisma.ambassadorProfile.findMany({
          include: {
            user: true,
          },
        })
      : [auth?.ambassador];

    return NextResponse.json({
      success: true,
      commissions,
      ambassadors,
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching commissions");
  }
}
