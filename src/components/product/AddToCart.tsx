"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { formatINR, discountPercent } from "@/lib/money";
import QtyStepper from "@/components/ui/QtyStepper";
import { btn, cx, micro } from "@/lib/styles";
import type { FullProduct } from "@/types/catalog";

export default function AddToCart({ product }: { product: FullProduct }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const toast = useToast((s) => s.show);

  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // The floating bar only appears once the real buttons scroll out of view.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return <p className="mt-4 text-maroon">Currently unavailable.</p>;

  const available = variant.stockQty - variant.reservedQty;
  const d = discountPercent(variant.pricePaise, variant.mrpPaise);
  const soldOut = available <= 0;

  const line = {
    variantId: variant.id, productId: product.id, slug: product.slug, name: product.name,
    variantName: variant.optionValue, sku: variant.sku,
    imageUrl: product.images[0]?.url ?? null, pricePaise: variant.pricePaise,
  };

  const buyNow = () => { add(line, qty); router.push("/checkout"); };

  return (
    <>
      <div className="mb-1 mt-2.5 flex flex-wrap items-baseline gap-3">
        <span className="text-[27px] font-extrabold text-maroon">{formatINR(variant.pricePaise)}</span>
        {d > 0 && (
          <>
            <span className="text-base text-faint line-through">{formatINR(variant.mrpPaise)}</span>
            <span className="text-[13.5px] font-extrabold text-forest">{d}% off</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted">Inclusive of all taxes</p>

      {product.variants.length > 1 && (
        <div className="mt-4">
          <span className={micro}>Choose {product.variants[0].optionName ?? "option"}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stockQty - v.reservedQty <= 0;
              return (
                <button key={v.id} onClick={() => setVariantId(v.id)} disabled={out}
                        className={cx(
                          "rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                          v.id === variantId ? "border-maroon bg-maroon text-white" : "border-line bg-paper hover:border-gold",
                          out && "line-through opacity-40"
                        )}>
                  {v.optionValue ?? v.sku}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {soldOut ? (
        <div className="mt-4 rounded border border-line-gold bg-cream p-4 text-center">
          <b className="block text-[10.5px] font-extrabold uppercase tracking-[0.13em]">Currently sold out</b>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Message us on WhatsApp and we will tell you when it is back.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <QtyStepper qty={qty} onChange={setQty} max={available} />
            {available <= variant.lowStockAt && (
              <span className="text-[13.5px] font-bold text-maroon">Only {available} left</span>
            )}
          </div>

          <div ref={rowRef} className="mt-4 flex gap-2.5">
            <button className={cx(btn.line, "flex-1")}
                    onClick={() => { add(line, qty); toast(`${product.name} added to bag`); }}>
              Add to Bag
            </button>
            <button className={cx(btn.primary, "flex-1")} onClick={buyNow}>Buy Now</button>
          </div>

          {/* Floating buy bar. Sits ABOVE the mobile tab bar (bottom-tabbar),
              so the two can never cover each other. */}
          <div className={cx(
            "fixed inset-x-0 bottom-tabbar z-buybar flex items-center gap-2.5 border-t border-line-gold",
            "bg-[#F3E9D3]/97 px-4 py-2.5 backdrop-blur-md transition-transform duration-300 ease-silk lg:hidden",
            showBar ? "translate-y-0" : "translate-y-[130%]"
          )}>
            <div className="flex-none">
              <b className="block text-base text-maroon">{formatINR(variant.pricePaise)}</b>
              <span className="text-[10px] text-muted">{d > 0 ? `${d}% off` : "Incl. taxes"}</span>
            </div>
            <button className={cx(btn.primary, "flex-1")} onClick={buyNow}>Buy Now</button>
          </div>
        </>
      )}
    </>
  );
}
