import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import Rule from "@/components/ui/Rule";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <div className="wrap max-w-[720px] py-16 text-center">
      <span className="eyebrow text-maroon">Thank you</span>
      <h1 className="my-3 text-[clamp(30px,4vw,44px)]">Your order is confirmed</h1>
      <Rule className="mb-8" />

      <p className="text-[15px] text-[color:var(--muted)]">
        Order <b className="text-ink">{order.orderNumber}</b> ·{" "}
        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid online"}
      </p>
      <p className="mt-1 text-[13.5px] text-[color:var(--muted)]">
        A confirmation has been sent to {order.email}. Dispatch in 24–48 hours.
      </p>

      <div className="mt-10 rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-6 text-left">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between border-b border-[color:var(--line)] py-2.5 text-[14px]">
            <span>{i.productName}{i.variantName ? ` · ${i.variantName}` : ""} × {i.qty}</span>
            <span>{formatINR(i.lineTotalPaise)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 text-[13.5px]">
          <span>Shipping</span>
          <span>{order.shippingPaise === 0 ? "Free" : formatINR(order.shippingPaise)}</span>
        </div>
        {order.discountPaise > 0 && (
          <div className="flex justify-between py-2 text-[13.5px] text-maroon">
            <span>Discount</span><span>−{formatINR(order.discountPaise)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[color:var(--line)] pt-3 text-[17px]">
          <b>Total</b><b className="text-maroon">{formatINR(order.totalPaise)}</b>
        </div>

        <div className="mt-6 border-t border-[color:var(--line)] pt-4 text-[13.5px] text-[color:var(--muted)]">
          <b className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-ink">Delivering to</b>
          {addr.name}, {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""},<br />
          {addr.city}, {addr.state} {addr.pincode}
        </div>
      </div>

      <Link href="/collections/all" className="btn btn-line mt-8">Continue Shopping</Link>
    </div>
  );
}
