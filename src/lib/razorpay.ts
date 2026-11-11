import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayKeys() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TWKiX46zL1CxcL",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "LvhbZ47ODOPobs82zYc5FnuV",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "pixello_webhook_secret_2026",
  };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayKeys();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates a Razorpay Order.
 */
export async function createRazorpayOrder({
  amountInPaisa,
  currency = "INR",
  receipt,
  notes = {},
}: {
  amountInPaisa: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; isOfficial: boolean; amount: number; currency: string; receipt: string }> {
  try {
    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount: Math.round(amountInPaisa),
      currency,
      receipt,
      notes,
    });
    return {
      id: order.id,
      isOfficial: true,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || receipt,
    };
  } catch (err: any) {
    console.warn("Razorpay API order creation:", err?.message || err);
    return {
      id: "",
      isOfficial: false,
      amount: Math.round(amountInPaisa),
      currency,
      receipt,
    };
  }
}

/**
 * Verifies Razorpay payment signature
 * Signature format: HMAC_SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  // Only permit sandbox simulated payments in non-production development environments
  const isDev = process.env.NODE_ENV !== "production";
  if (
    isDev &&
    (razorpaySignature === "sandbox_verified" ||
      razorpaySignature === "cod_verified" ||
      razorpayPaymentId.startsWith("pay_sandbox_") ||
      razorpayPaymentId.startsWith("COD_"))
  ) {
    return true;
  }

  try {
    const { keySecret } = getRazorpayKeys();
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature);
    const signatureBuf = Buffer.from(razorpaySignature);

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature
 */
export function verifyWebhookSignature({
  bodyString,
  signature,
}: {
  bodyString: string;
  signature: string;
}): boolean {
  if (!bodyString || !signature) return false;
  try {
    const { webhookSecret } = getRazorpayKeys();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyString)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature);
    const signatureBuf = Buffer.from(signature);

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}
