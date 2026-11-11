import crypto from "crypto";

export interface ImageValidationResult {
  valid: boolean;
  format?: "jpeg" | "png" | "webp" | "gif";
  mimeType?: string;
  buffer?: Buffer;
  error?: string;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates image buffer using magic bytes signature detection
 */
export function validateImageBuffer(
  buffer: Buffer,
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty image payload" };
  }

  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: `Image exceeds maximum allowed size of ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`,
    };
  }

  // 1. JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      valid: true,
      format: "jpeg",
      mimeType: "image/jpeg",
      buffer,
    };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      valid: true,
      format: "png",
      mimeType: "image/png",
      buffer,
    };
  }

  // 3. WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return {
      valid: true,
      format: "webp",
      mimeType: "image/webp",
      buffer,
    };
  }

  // 4. GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return {
      valid: true,
      format: "gif",
      mimeType: "image/gif",
      buffer,
    };
  }

  return {
    valid: false,
    error: "Invalid file type. Only genuine JPG, PNG, and WebP images are allowed.",
  };
}

/**
 * Validates Base64 data URL string and extracts verified Buffer
 */
export function validateBase64Image(
  dataUrlOrBase64: string,
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES
): ImageValidationResult {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string") {
    return { valid: false, error: "Missing image string" };
  }

  try {
    const base64Index = dataUrlOrBase64.indexOf(";base64,");
    const rawBase64 =
      base64Index !== -1
        ? dataUrlOrBase64.substring(base64Index + 8)
        : dataUrlOrBase64;

    const buffer = Buffer.from(rawBase64, "base64");
    return validateImageBuffer(buffer, maxSizeBytes);
  } catch (err: any) {
    return { valid: false, error: "Malformed base64 image data" };
  }
}

/**
 * Generates an unguessable, secure storage filename
 */
export function generateSecureFilename(format: "jpeg" | "png" | "webp" | "gif"): string {
  const randomHex = crypto.randomBytes(16).toString("hex");
  const ext = format === "jpeg" ? "jpg" : format;
  return `pxl_${Date.now()}_${randomHex}.${ext}`;
}

/**
 * Sanitizes arbitrary filename, removing path traversal sequences
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/^.*[\\\/]/, "") // strip directory components
    .replace(/[^a-zA-Z0-9._-]/g, "_") // strip illegal chars
    .slice(0, 100);
}
