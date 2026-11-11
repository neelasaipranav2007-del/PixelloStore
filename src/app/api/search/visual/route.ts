import { NextResponse } from "next/server";
import { searchByImage, readCachedIndex, indexCatalogProducts } from "@/lib/visualSearch";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// In-memory rate limiting sliding window (IP -> [timestamps])
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 30;
const WINDOW_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_DURATION_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(clientIp, validTimestamps);
  return true;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET() {
  try {
    const cachedIndex = readCachedIndex();
    const count = Object.keys(cachedIndex).length;

    return NextResponse.json({
      success: true,
      status: "ready",
      model: "CLIP (ViT-B/32 ONNX)",
      embeddingDimension: 512,
      totalIndexedProducts: count,
      supportedFormats: ["image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 10,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Rate limiting check
    const rateLimitRes = enforceRateLimit(req, "visualSearch");
    if (rateLimitRes) return rateLimitRes;

    const contentType = req.headers.get("content-type") || "";

    let imageBuffer: Buffer | null = null;
    let base64String: string | null = null;

    // 2. Parse Multipart FormData or JSON payload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      const base64Field = formData.get("imageBase64") as string | null;

      if (file && typeof file === "object" && file.size > 0) {
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
          return NextResponse.json(
            {
              success: false,
              error: `Unsupported image format (${file.type}). Please upload a JPG, JPEG, PNG, or WebP image.`,
            },
            { status: 400 }
          );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              success: false,
              error: `Image size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller photo.`,
            },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else if (base64Field) {
        base64String = base64Field;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.imageBase64) {
        base64String = body.imageBase64;
      } else if (body.image) {
        base64String = body.image;
      } else if (body.imageUrl) {
        base64String = body.imageUrl;
      }
    }

    // 3. Validate image data was provided
    if (!imageBuffer && !base64String) {
      return NextResponse.json(
        {
          success: false,
          error: "No image provided. Please upload an image file or take a photo.",
        },
        { status: 400 }
      );
    }

    // Validate base64 size if provided
    if (base64String && base64String.startsWith("data:")) {
      const approxSizeBytes = (base64String.length * 3) / 4;
      if (approxSizeBytes > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "Image exceeds 10MB limit. Please select a smaller photo.",
          },
          { status: 400 }
        );
      }
    }

    // 4. Perform visual search using the AI vision pipeline
    const input = imageBuffer || base64String!;
    const searchResponse = await searchByImage(input, {
      topK: 8,
      exactThreshold: 0.82,
      similarThreshold: 0.72,
      minThreshold: 0.65,
    });

    return NextResponse.json(searchResponse);
  } catch (error: any) {
    console.error("[Visual Search API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process visual search. Please try again with a clear photo.",
      },
      { status: 500 }
    );
  }
}
