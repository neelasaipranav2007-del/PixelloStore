import { NextResponse } from "next/server";
import { DEFAULT_HOMEPAGE_STATS, HomepageStatsConfig } from "@/lib/homepageStats";

let inMemoryStats: HomepageStatsConfig = { ...DEFAULT_HOMEPAGE_STATS };

export async function GET() {
  return NextResponse.json({
    success: true,
    stats: inMemoryStats,
  });
}

export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
