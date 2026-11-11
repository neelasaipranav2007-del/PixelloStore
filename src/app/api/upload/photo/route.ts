import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import {
  validateImageBuffer,
  validateBase64Image,
  generateSecureFilename,
  sanitizeFilename,
} from "@/lib/imageValidator";
import { enforceRateLimit } from "@/lib/rateLimit";
import { safeErrorResponse } from "@/lib/errorHandler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "storage", "private_photos");

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = enforceRateLimit(req, "upload");
    if (rateLimitRes) return rateLimitRes;

    // 2. Authentication Check
    const authUser = await getAuthenticatedUser(req);
    const admin = await getAuthenticatedAdmin(req);

    if (!authUser && !admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Sign in required to upload personal photographs." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let validationResult;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      validationResult = validateImageBuffer(buffer);
    } else {
      let body: any;
      try {
        body = await req.json();
      } catch (parseErr: any) {
        return NextResponse.json(
          { success: false, error: "Image payload exceeds maximum allowed size (10MB limit) or is malformed." },
          { status: 413 }
        );
      }
      const { imageBase64, image } = body;
      const raw = imageBase64 || image;
      if (!raw) {
        return NextResponse.json({ success: false, error: "No image data provided." }, { status: 400 });
      }
      validationResult = validateBase64Image(raw);
    }

    // 3. Magic Byte & Format Validation
    if (!validationResult.valid || !validationResult.buffer || !validationResult.format) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || "Invalid file. Only genuine JPG, PNG, and WebP images are permitted.",
        },
        { status: 400 }
      );
    }

    // Ensure private storage directory exists
    if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
      fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
    }

    // 4. Unguessable File Storage
    const secureName = generateSecureFilename(validationResult.format);
    const targetPath = path.join(PRIVATE_STORAGE_DIR, secureName);
    fs.writeFileSync(targetPath, validationResult.buffer);

    const ownerId = authUser?.id || admin?.user?.id || "unknown";

    // Track photo ownership in system setting for instant IDOR protection
    await prisma.systemSetting.create({
      data: {
        key: `photo_owner_${secureName}`,
        value: JSON.stringify({
          ownerId,
          format: validationResult.format,
          mimeType: validationResult.mimeType,
          uploadedAt: new Date().toISOString(),
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      photoId: secureName,
      url: `/api/customer/photos/${secureName}`,
      format: validationResult.format,
      sizeBytes: validationResult.buffer.length,
      message: "Photograph securely uploaded and stored in private protected vault.",
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error uploading photo");
  }
}
