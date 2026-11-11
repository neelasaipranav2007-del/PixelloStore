import { NextResponse } from "next/server";
import { DEFAULT_HOMEPAGE_STATS, HomepageStatsConfig } from "@/lib/homepageStats";
import { getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

let inMemoryStats: HomepageStatsConfig = { ...DEFAULT_HOMEPAGE_STATS };

export async function GET() {
  return NextResponse.json({
    success: true,
    stats: inMemoryStats,
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to update homepage stats." },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (body.stats) {
      inMemoryStats = {
        ...inMemoryStats,
        ...body.stats,
      };
    }
    return NextResponse.json({
      success: true,
      stats: inMemoryStats,
    });
  } catch (err: any) {
    return safeErrorResponse(err, 500, "Error updating homepage stats");
  }
}
