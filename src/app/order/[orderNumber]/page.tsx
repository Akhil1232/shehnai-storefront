import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import StepBar from "@/components/ui/StepBar";
import { btn, cx, summaryRow, summaryTotal, wrap } from "@/lib/styles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmed" };

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) notFound();

  const a = order.shippingAddress as Record<string, string>;

  return (
    <div className={wrap}>
      <div className="mx-auto max-w-[620px] pb-15 pt-6 text-center">
        <StepBar current={3} />

        <div className="mx-auto mb-5 mt-4 grid h-16 w-16 place-items-center rounded-full bg-forest">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white stroke-[2.4]">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-h1">Thank you — your order is confirmed</h1>
        <p className="mb-1 mt-2.5 text-[13.5px] text-muted">
          Order <b className="text-ink">{order.orderNumber}</b> · Paid online
        </p>
        <p className="text-[13.5px] text-muted">
          A confirmation is on its way to {order.email}. Dispatched within 2–3 working days.
        </p>

        <div className="mt-6 rounded border border-line-gold bg-paper p-5 text-left">
          {order.items.map((i) => (
            <div key={i.id} className={summaryRow}>
              <span>{i.productName}{i.variantName ? ` · ${i.variantName}` : ""} × {i.qty}</span>
              <span>{formatINR(i.lineTotalPaise)}</span>
            </div>
          ))}
          <div className={summaryRow}>
            <span>Shipping</span>
            <span className={order.shippingPaise ? "" : "font-bold text-forest"}>
              {order.shippingPaise ? formatINR(order.shippingPaise) : "FREE"}
            </span>
          </div>
          {order.discountPaise > 0 && (
            <div className={cx(summaryRow, "text-maroon")}>
              <span>Discount</span><span>−{formatINR(order.discountPaise)}</span>
            </div>
          )}
          <div className={summaryTotal}><span>Total</span><b className="text-maroon">{formatINR(order.totalPaise)}</b></div>

          <div className="mt-5 border-t border-line pt-3.5">
            <b className="mb-1.5 block text-[10.5px] font-extrabold uppercase tracking-[0.13em]">Delivering to</b>
            <address className="text-[13.5px] not-italic leading-relaxed text-muted">
              {a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}, {a.state} {a.pincode}<br />{a.phone}
            </address>
          </div>
        </div>

        <div className="mt-4 rounded border border-line-gold bg-cream p-4 text-left">
          <b className="mb-1.5 block text-[10.5px] font-extrabold uppercase tracking-[0.13em]">
            Please record your unboxing
          </b>
          <p className="text-[12.5px] leading-relaxed text-muted">
            If anything arrives damaged, incorrect or missing we will replace it — but we need a
            continuous, unedited video of the parcel being opened. Start recording before you cut the
            packaging, and keep the shipping label visible.{" "}
            <Link href="/policies/returns" className="font-bold text-maroon">Full replacement policy</Link>
          </p>
        </div>

        <Link href="/collections/all" className={cx(btn.line, "mt-6")}>Continue Shopping</Link>
      </div>
    </div>
  );
}
