import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DEFAULT_BANNERS_CONFIG,
  AdminBannersConfig,
} from "@/lib/spotlightConfig";
import { getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

const DATA_FILE = path.join(process.cwd(), "scratch", "spotlight_banners.json");

let inMemoryBanners: AdminBannersConfig = { ...DEFAULT_BANNERS_CONFIG };

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    inMemoryBanners = { ...DEFAULT_BANNERS_CONFIG, ...JSON.parse(raw) };
  }
} catch {
  // Use defaults
}

function persistToDisk(data: AdminBannersConfig) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist spotlight banners to disk:", err);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    banners: inMemoryBanners,
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to update spotlight banners." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (body.banners) {
      inMemoryBanners = {
        spotlight: {
          ...inMemoryBanners.spotlight,
          ...(body.banners.spotlight || {}),
        },
        welcomePromo: {
          ...inMemoryBanners.welcomePromo,
          ...(body.banners.welcomePromo || {}),
        },
      };
      persistToDisk(inMemoryBanners);
    }

    return NextResponse.json({
      success: true,
      banners: inMemoryBanners,
    });
  } catch (err: any) {
    return safeErrorResponse(err, 500, "Error updating spotlight banners");
  }
}
