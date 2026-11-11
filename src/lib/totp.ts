import crypto from "crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into Base32 string (RFC 4648)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random 20-byte base32 secret for TOTP (RFC 6238)
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generates the standard TOTP token for a given timestamp
 */
export function generateTotpToken(secretBase32: string, timeStep = Math.floor(Date.now() / 1000 / 30)): string {
  const key = base32Decode(secretBase32);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const str = String(code % 1000000);
  return str.padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP token against secret with ±1 time step tolerance (90s window)
 */
export function verifyTotpToken(secretBase32: string, token: string): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  // Check -1, 0, +1 time windows to account for clock drift
  for (let stepOffset = -1; stepOffset <= 1; stepOffset++) {
    const expected = generateTotpToken(secretBase32, currentStep + stepOffset);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates 8 cryptographically secure single-use recovery codes
 */
export function generateRecoveryCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 chars
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    plainCodes.push(formatted);

    const hash = crypto.createHash("sha256").update(formatted).digest("hex");
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verifies and consumes a recovery code against stored recovery hashes
 */
export function verifyRecoveryCode(
  submittedCode: string,
  storedHashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const clean = submittedCode.trim().toUpperCase();
  const submittedHash = crypto.createHash("sha256").update(clean).digest("hex");

  const matchIndex = storedHashedCodes.findIndex((h) => h === submittedHash);
  if (matchIndex === -1) {
    return { valid: false, remainingHashedCodes: storedHashedCodes };
  }

  const remaining = [...storedHashedCodes];
  remaining.splice(matchIndex, 1);
  return { valid: true, remainingHashedCodes: remaining };
}

/**
 * Generates standard otpauth:// QR URI
 */
export function getTotpUri(accountName: string, secretBase32: string, issuer = "PixelloStore"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
