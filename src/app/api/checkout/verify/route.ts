import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { commitReservation } from "@/lib/inventory";

export const runtime = "nodejs";

/**
 * Called by the browser after the Razorpay modal succeeds. The signature check
 * is what makes this trustworthy — a forged POST cannot mark an order paid.
 * The webhook is the backstop for when the customer closes the tab too early.
 */
export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const ok = verifyPaymentSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Idempotent: the webhook may have got here first.
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ orderNumber: order.orderNumber });
  }

  await prisma.$transaction(async (tx) => {
    await commitReservation(
      order.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, qty: i.qty })),
      order.orderNumber,
      tx
    );
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }
  });

  return NextResponse.json({ orderNumber: order.orderNumber });
}
