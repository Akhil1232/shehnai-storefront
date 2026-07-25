import crypto from "crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
    }
    client = new Razorpay({ key_id, key_secret });
  }
  return client;
}

/**
 * Confirms the browser's success payload really came from Razorpay.
 * Never mark an order paid without this passing.
 */
export function verifyPaymentSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, args.signature);
}

/** Webhooks are signed with a different secret than payments. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
