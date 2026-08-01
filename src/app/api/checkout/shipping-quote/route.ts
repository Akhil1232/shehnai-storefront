import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeShipping } from "@/lib/shipping";

export const runtime = "nodejs";

type Body = {
  items: { variantId: string; qty: number }[];
  pincode: string;
  paymentMethod: "RAZORPAY" | "COD";
};

/**
 * Live shipping estimate for the checkout summary. Prices/weights are re-read
 * from the database, same as /api/checkout/create — the client only supplies
 * variant ids and quantities.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const pincode = (body.pincode ?? "").replace(/\D/g, "");
    if (pincode.length !== 6) {
      return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: body.items.map((i) => i.variantId) } },
      include: { product: true },
    });

    let subtotalPaise = 0;
    let weightGrams = 0;
    for (const item of body.items) {
      const v = variants.find((x) => x.id === item.variantId);
      if (!v) continue;
      const qty = Math.max(1, Math.min(item.qty, 20));
      subtotalPaise += v.pricePaise * qty;
      weightGrams += (v.product.weightGrams ?? 150) * qty;
    }

    const settings = await getSettings();
    const quote = await computeShipping({
      subtotalPaise,
      weightGrams: weightGrams || 500,
      pincode,
      paymentMethod: body.paymentMethod === "COD" ? "COD" : "RAZORPAY",
      settings,
    });

    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not calculate shipping.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
