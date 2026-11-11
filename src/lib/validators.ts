/**
 * Input sanitization and data validation utilities for PixelloStore
 */

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS)
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Normalizes and strips dangerous script tags and event handlers from text
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validates standard 10-digit Indian mobile number
 */
export function isValidIndianPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  // Matches 10-digit number optionally prefixed by 91 or 0
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits);
  if (digits.length === 12 && digits.startsWith("91")) return /^[6-9]\d{9}$/.test(digits.slice(2));
  return false;
}

/**
 * Extracts normalized 10-digit phone
 */
export function normalizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  return phone.replace(/\D/g, "").slice(-10);
}

/**
 * Validates 6-digit Indian PIN code
 */
export function isValidPincode(pincode: unknown): boolean {
  if (typeof pincode !== "string" && typeof pincode !== "number") return false;
  const str = String(pincode).trim();
  return /^[1-9][0-9]{5}$/.test(str);
}

/**
 * Validates standard email address
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates promo / coupon code format (alphanumeric, 3-20 characters)
 */
export function isValidPromoCode(code: unknown): boolean {
  if (typeof code !== "string") return false;
  return /^[A-Za-z0-9_-]{3,20}$/.test(code.trim());
}

/**
 * Validates order items list structure
 */
export function validateOrderItems(items: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "Items array is required and must not be empty" };
  }
  if (items.length > 50) {
    return { valid: false, error: "Order exceeds maximum limit of 50 distinct items" };
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it !== "object") {
      return { valid: false, error: `Invalid item object at index ${i}` };
    }
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      return { valid: false, error: `Item at index ${i} has invalid quantity (${it.quantity})` };
    }
    if (it.name && typeof it.name !== "string") {
      return { valid: false, error: `Item at index ${i} has invalid name format` };
    }
  }

  return { valid: true };
}
