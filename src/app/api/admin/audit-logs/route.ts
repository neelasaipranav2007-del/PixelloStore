import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminAuth } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { admin, response } = await requireAdminAuth(req);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action");

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const totalCount = await prisma.auditLog.count({ where });

    return NextResponse.json({
      success: true,
      logs,
      totalCount,
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching audit logs");
  }
}
