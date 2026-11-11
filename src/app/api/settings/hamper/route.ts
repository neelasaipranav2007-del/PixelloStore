import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DEFAULT_HAMPER_CONFIG,
  HamperStoreConfig,
} from "@/lib/hamperConfig";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

const DATA_FILE = path.join(process.cwd(), "scratch", "hamper_settings.json");

let inMemoryHamperConfig: HamperStoreConfig = { ...DEFAULT_HAMPER_CONFIG };

// Load from disk if file exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    inMemoryHamperConfig = {
      nav: { ...DEFAULT_HAMPER_CONFIG.nav, ...(parsed.nav || {}) },
      homepage: { ...DEFAULT_HAMPER_CONFIG.homepage, ...(parsed.homepage || {}) },
      packagingOptions: parsed.packagingOptions || DEFAULT_HAMPER_CONFIG.packagingOptions,
      boxAddons: parsed.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons,
      aboutTitle: parsed.aboutTitle || DEFAULT_HAMPER_CONFIG.aboutTitle,
      aboutPoints: Array.isArray(parsed.aboutPoints) ? parsed.aboutPoints : DEFAULT_HAMPER_CONFIG.aboutPoints,
    };
  }
} catch {
  // Use defaults
}

function persistToDisk(data: HamperStoreConfig) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist hamper config to disk:", err);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    config: inMemoryHamperConfig,
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to update hamper settings." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (body.config) {
      inMemoryHamperConfig = {
        nav: {
          ...inMemoryHamperConfig.nav,
          ...(body.config.nav || {}),
        },
        homepage: {
          ...inMemoryHamperConfig.homepage,
          ...(body.config.homepage || {}),
        },
        packagingOptions: body.config.packagingOptions || inMemoryHamperConfig.packagingOptions,
        boxAddons: body.config.boxAddons || inMemoryHamperConfig.boxAddons,
        aboutTitle: body.config.aboutTitle !== undefined ? body.config.aboutTitle : inMemoryHamperConfig.aboutTitle,
        aboutPoints: Array.isArray(body.config.aboutPoints) ? body.config.aboutPoints : inMemoryHamperConfig.aboutPoints,
      };
      persistToDisk(inMemoryHamperConfig);

      // Keep PRD-111 Product in database in sync
      try {
        const updateData: { aboutTitle?: string; aboutPoints?: string } = {};
        if (inMemoryHamperConfig.aboutTitle) updateData.aboutTitle = inMemoryHamperConfig.aboutTitle;
        if (inMemoryHamperConfig.aboutPoints) updateData.aboutPoints = JSON.stringify(inMemoryHamperConfig.aboutPoints);
        await prisma.product.updateMany({
          where: {
            OR: [
              { id: "PRD-111" },
              { name: "Hamper" },
              { categoryName: "Hamper" },
            ],
          },
          data: updateData,
        });
      } catch (dbErr) {
        console.warn("Could not sync hamper product in SQLite:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      config: inMemoryHamperConfig,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
