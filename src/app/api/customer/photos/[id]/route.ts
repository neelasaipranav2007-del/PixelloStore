import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { sanitizeFilename } from "@/lib/imageValidator";
import { safeErrorResponse } from "@/lib/errorHandler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "storage", "private_photos");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const cleanId = sanitizeFilename(rawId);

    // 1. Authentication Check
    const authUser = await getAuthenticatedUser(req);
    const admin = await getAuthenticatedAdmin(req);

    if (!authUser && !admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required to view private customer photographs." },
        { status: 401 }
      );
    }

    // 2. Ownership Verification (IDOR Protection)
    const ownerSetting = await prisma.systemSetting.findUnique({
      where: { key: `photo_owner_${cleanId}` },
    });

    if (ownerSetting?.value) {
      try {
        const metadata = JSON.parse(ownerSetting.value);
        if (!admin && metadata.ownerId && metadata.ownerId !== authUser?.id) {
          return NextResponse.json(
            { success: false, error: "Forbidden. You are not authorized to view another customer's private photo." },
            { status: 403 }
          );
        }
      } catch {}
    }

    const filePath = path.join(PRIVATE_STORAGE_DIR, cleanId);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "Photograph not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(cleanId).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error retrieving photograph");
  }
}
