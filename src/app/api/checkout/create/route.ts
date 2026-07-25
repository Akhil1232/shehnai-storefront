import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getSettings, shippingFor } from "@/lib/settings";
import { reserveStock } from "@/lib/inventory";
import { orderNumber } from "@/lib/slug";

export const runtime = "nodejs";

type Body = {
  items: { variantId: string; qty: number }[];
  email: string;
  phone: string;
  address: {
    name: string; phone: string; line1: string; line2?: string;
    city: string; state: string; pincode: string;
  };
  paymentMethod: "RAZORPAY" | "COD";
  couponCode?: string;
};

/**
 * Creates the order server-side. CRITICAL: prices are re-read from the database
 * here — whatever the browser sent in its cart is treated as untrusted input and
 * used only to identify variants and quantities.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.items?.length) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }

    const settings = await getSettings();
    if (body.paymentMethod === "COD" && !settings.codEnabled) {
      return NextResponse.json({ error: "Cash on delivery is unavailable." }, { status: 400 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: body.items.map((i) => i.variantId) }, isActive: true },
      include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
    });

    if (variants.length !== body.items.length) {
      return NextResponse.json({ error: "One of these pieces is no longer available." }, { status: 409 });
    }

    // --- authoritative pricing ------------------------------------------
    const items = body.items.map((i) => {
      const v = variants.find((x) => x.id === i.variantId)!;
      const qty = Math.max(1, Math.min(i.qty, 20));
      return {
        variantId: v.id,
        productName: v.product.name,
        variantName: v.optionValue,
        sku: v.sku,
        imageUrl: v.product.images[0]?.url ?? null,
        unitPricePaise: v.pricePaise,
        qty,
        lineTotalPaise: v.pricePaise * qty,
      };
    });

    const subtotalPaise = items.reduce((n, i) => n + i.lineTotalPaise, 0);

    // --- coupon ----------------------------------------------------------
    let discountPaise = 0;
    if (body.couponCode) {
      const c = await prisma.coupon.findUnique({ where: { code: body.couponCode.toUpperCase() } });
      const now = new Date();
      const valid =
        c && c.isActive &&
        subtotalPaise >= c.minOrderPaise &&
        (!c.startsAt || c.startsAt <= now) &&
        (!c.endsAt || c.endsAt >= now) &&
        (c.usageLimit === null || c.usedCount < c.usageLimit);
      if (valid) {
        discountPaise =
          c.type === "PERCENT"
            ? Math.round((subtotalPaise * c.value) / 100)
            : c.value;
        if (c.maxDiscountPaise) discountPaise = Math.min(discountPaise, c.maxDiscountPaise);
      }
    }

    const shippingPaise = shippingFor(subtotalPaise - discountPaise, settings);
    const codFee = body.paymentMethod === "COD" ? settings.codFeePaise : 0;
    const totalPaise = subtotalPaise - discountPaise + shippingPaise + codFee;

    // --- persist ---------------------------------------------------------
    const todayCount = await prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    const number = orderNumber(todayCount + 1);

    const order = await prisma.$transaction(async (tx) => {
      // Reserve first — this throws and rolls everything back if stock ran out.
      await reserveStock(items.map((i) => ({ variantId: i.variantId, qty: i.qty })), number, tx);

      return tx.order.create({
        data: {
          orderNumber: number,
          email: body.email,
          phone: body.phone,
          paymentMethod: body.paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
          subtotalPaise,
          discountPaise,
          shippingPaise: shippingPaise + codFee,
          totalPaise,
          couponCode: body.couponCode ?? null,
          shippingAddress: body.address,
          items: { create: items },
        },
      });
    });

    // --- COD stops here; nothing to charge -------------------------------
    if (body.paymentMethod === "COD") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });
      return NextResponse.json({ orderNumber: order.orderNumber, cod: true });
    }

    // --- Razorpay --------------------------------------------------------
    const rzOrder = await razorpay().orders.create({
      amount: totalPaise, // already paise
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzOrder.id },
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      razorpayOrderId: rzOrder.id,
      amount: totalPaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    console.error("[checkout/create]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
