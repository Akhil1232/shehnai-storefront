import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseReservation } from "@/lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Frees stock held by checkouts that were never paid for.
 *
 * Without this, every abandoned cart permanently locks its items in
 * `reservedQty` and the storefront starts showing phantom "only 2 left"
 * warnings on pieces sitting in a drawer.
 *
 * Run every 15 minutes:
 *   curl -fsS -H "x-cron-secret: $CRON_SECRET" https://yourdomain/api/cron/release-reservations
 */
const STALE_MINUTES = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000);

  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: { lt: cutoff },
    },
    include: { items: true },
    take: 100,
  });

  let released = 0;
  for (const order of stale) {
    const lines = order.items
      .filter((i) => i.variantId)
      .map((i) => ({ variantId: i.variantId!, qty: i.qty }));

    try {
      await prisma.$transaction(async (tx) => {
        await releaseReservation(lines, order.orderNumber, tx);
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", paymentStatus: "FAILED", notes: "Auto-cancelled: payment not completed" },
        });
      });
      released++;
    } catch (err) {
      // One bad order must not stop the rest of the sweep.
      console.error(`[cron] could not release ${order.orderNumber}`, err);
    }
  }

  return NextResponse.json({ checked: stale.length, released });
}
