"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import ProductMedia from "@/components/ui/ProductMedia";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import StepBar from "@/components/ui/StepBar";
import ShipProgress from "@/components/ui/ShipProgress";
import PolicyNote from "@/components/ui/PolicyNote";
import EmptyState from "@/components/ui/EmptyState";
import QtyStepper from "@/components/ui/QtyStepper";
import { btn, btnFull, cx, jewelField, linkArrow, summaryRow, summaryTotal, wrap } from "@/lib/styles";

export default function CartView({
  freeShippingAt, flatShipping,
}: { freeShippingAt: number; flatShipping: number }) {
  const { lines, setQty, remove } = useCart();
  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const shipping = subtotal >= freeShippingAt ? 0 : flatShipping;
  const count = lines.reduce((n, l) => n + l.qty, 0);

  if (!lines.length) {
    return (
      <div className={wrap}>
        <EmptyState icon="bag" title="Your bag is empty"
                    body="Once you add something, it will show up here."
                    action={{ label: "Start shopping", href: "/collections/all" }} />
      </div>
    );
  }

  return (
    <div className={wrap}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag" }]} />
      <StepBar current={1} />
      <h1 className="mb-1 mt-2.5 text-h1">Your Bag</h1>
      <p className="text-[13.5px] text-muted">{count} item{count === 1 ? "" : "s"}</p>

      <div className="grid gap-6 py-4 pb-12 lg:grid-cols-[1fr_350px] lg:gap-9">
        <div>
          {lines.map((l) => (
            <div key={l.variantId} className="flex gap-3.5 border-b border-line py-4">
              <Link href={`/product/${l.slug}`}
                    className={cx(jewelField, "h-20 w-20 flex-none rounded-[2px] border border-line sm:h-[84px] sm:w-[84px]")}>
                <ProductMedia url={l.imageUrl} alt={l.name} seed={l.slug} sizes="84px" />
              </Link>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-base font-semibold">
                  <Link href={`/product/${l.slug}`}>{l.name}</Link>
                </h4>
                <p className="mb-2 text-[11.5px] text-muted">
                  {l.variantName ? `${l.variantName} · ` : ""}{formatINR(l.pricePaise)} each
                </p>
                <QtyStepper qty={l.qty} onChange={(q) => setQty(l.variantId, q)} small />
              </div>
              <div className="flex-none text-right">
                <b className="text-maroon">{formatINR(l.pricePaise * l.qty)}</b>
                <button onClick={() => remove(l.variantId)}
                        className="mt-2 block text-[10.5px] font-bold uppercase tracking-[0.1em] text-faint hover:text-maroon">
                  Remove
                </button>
              </div>
            </div>
          ))}
          <Link href="/collections/all" className={cx(linkArrow, "mt-4")}>&larr; Continue shopping</Link>
        </div>

        <aside className="h-fit rounded border border-line-gold bg-paper p-5 lg:sticky lg:top-sticky-top">
          <h2 className="mb-3 text-[19px]">Order Summary</h2>
          <ShipProgress subtotal={subtotal} threshold={freeShippingAt} />
          <div className={summaryRow}><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className={summaryRow}>
            <span>Shipping</span>
            <span className={shipping ? "" : "font-bold text-forest"}>{shipping ? formatINR(shipping) : "FREE"}</span>
          </div>
          <div className={summaryTotal}><span>Total</span><b className="text-maroon">{formatINR(subtotal + shipping)}</b></div>
          <Link href="/checkout" className={cx(btn.primary, btnFull, "mt-3.5")}>Proceed to Checkout</Link>
          <div className="mt-3.5"><PolicyNote /></div>
        </aside>
      </div>
    </div>
  );
}
