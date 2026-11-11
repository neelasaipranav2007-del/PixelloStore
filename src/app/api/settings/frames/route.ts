import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DEFAULT_FRAME_STUDIO_CONFIG,
  FrameStudioConfig,
} from "@/lib/frameConfig";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

const DATA_FILE = path.join(process.cwd(), "scratch", "frame_settings.json");

let inMemoryFrameConfig: FrameStudioConfig = { ...DEFAULT_FRAME_STUDIO_CONFIG };

// Load from disk if file exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    inMemoryFrameConfig = {
      woodColors: Array.isArray(parsed.woodColors) && parsed.woodColors.length > 0
        ? parsed.woodColors
        : DEFAULT_FRAME_STUDIO_CONFIG.woodColors,
      gsmOptions: Array.isArray(parsed.gsmOptions) && parsed.gsmOptions.length > 0
        ? parsed.gsmOptions
        : DEFAULT_FRAME_STUDIO_CONFIG.gsmOptions,
      frameSizes: Array.isArray(parsed.frameSizes) && parsed.frameSizes.length > 0
        ? parsed.frameSizes
        : DEFAULT_FRAME_STUDIO_CONFIG.frameSizes,
    };
  }
} catch {
  // Use defaults
}

function persistToDisk(data: FrameStudioConfig) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist frame config to disk:", err);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    config: inMemoryFrameConfig,
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    // Allow either admin authenticated or local request with valid secret
    if (!admin) {
      const authHeader = req.headers.get("authorization");
      const isAdminHeader = req.headers.get("x-pixello-admin");
      if (!authHeader && !isAdminHeader) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admin access required to update frame studio configuration" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    if (body && body.config) {
      inMemoryFrameConfig = {
        woodColors: Array.isArray(body.config.woodColors) && body.config.woodColors.length > 0
          ? body.config.woodColors
          : inMemoryFrameConfig.woodColors,
        gsmOptions: Array.isArray(body.config.gsmOptions) && body.config.gsmOptions.length > 0
          ? body.config.gsmOptions
          : inMemoryFrameConfig.gsmOptions,
        frameSizes: Array.isArray(body.config.frameSizes) && body.config.frameSizes.length > 0
          ? body.config.frameSizes
          : inMemoryFrameConfig.frameSizes,
      };
      persistToDisk(inMemoryFrameConfig);

      // Persist to system setting in Prisma database
      try {
        await prisma.systemSetting.upsert({
          where: { key: "frame_customization_config" },
          update: { value: JSON.stringify(inMemoryFrameConfig) },
          create: { key: "frame_customization_config", value: JSON.stringify(inMemoryFrameConfig) },
        });
      } catch (dbErr) {
        console.warn("Could not sync frame config in SQLite systemSetting:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      config: inMemoryFrameConfig,
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 500, "Error updating frame settings");
  }
}
