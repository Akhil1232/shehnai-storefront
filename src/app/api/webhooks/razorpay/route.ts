import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { commitReservation, releaseReservation } from "@/lib/inventory";

export const runtime = "nodejs";

/**
 * Backstop for payments where the customer closed the tab before /verify ran.
 * Configure at Razorpay Dashboard -> Settings -> Webhooks:
 *   URL:    https://YOURDOMAIN/api/webhooks/razorpay
 *   Events: payment.captured, payment.failed
 * Must read the RAW body — re-serialising JSON breaks the HMAC.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload: { payment: { entity: { id: string; order_id: string } } };
  };
  const payment = event.payload?.payment?.entity;
  if (!payment) return NextResponse.json({ ok: true });

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId: payment.order_id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ ok: true });

  const lines = order.items
    .filter((i) => i.variantId)
    .map((i) => ({ variantId: i.variantId!, qty: i.qty }));

  if (event.event === "payment.captured" && order.paymentStatus !== "PAID") {
    await prisma.$transaction(async (tx) => {
      await commitReservation(lines, order.orderNumber, tx);
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED", razorpayPaymentId: payment.id },
      });
    });
  }

  if (event.event === "payment.failed" && order.paymentStatus === "PENDING") {
    await prisma.$transaction(async (tx) => {
      await releaseReservation(lines, order.orderNumber, tx);
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
    });
  }

  return NextResponse.json({ ok: true });
}
