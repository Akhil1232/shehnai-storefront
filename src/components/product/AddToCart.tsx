"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { formatINR, discountPercent } from "@/lib/money";
import type { FullProduct } from "@/types/catalog";

export default function AddToCart({ product }: { product: FullProduct }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const close = useCart((s) => s.close);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return <p className="text-maroon">Currently unavailable.</p>;

  const available = variant.stockQty - variant.reservedQty;
  const off = discountPercent(variant.pricePaise, variant.mrpPaise);
  const hasOptions = product.variants.length > 1;

  const line = {
    variantId: variant.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantName: variant.optionValue,
    sku: variant.sku,
    imageUrl: product.images[0]?.url ?? null,
    pricePaise: variant.pricePaise,
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <b className="text-[26px] font-bold text-maroon">{formatINR(variant.pricePaise)}</b>
        {off > 0 && (
          <>
            <s className="text-[15px] text-[rgba(36,28,21,.4)]">{formatINR(variant.mrpPaise)}</s>
            <span className="text-[13px] font-bold text-maroon">{off}% off</span>
          </>
        )}
      </div>
      <p className="mt-1 text-[12px] text-[color:var(--muted)]">Inclusive of all taxes</p>

      {hasOptions && (
        <div className="mt-5">
          <b className="mb-2 block text-[11px] uppercase tracking-[0.14em]">
            {product.variants[0].optionName ?? "Option"}
          </b>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stockQty - v.reservedQty <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  disabled={out}
                  className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] disabled:opacity-40 ${
                    v.id === variantId
                      ? "border-ink bg-ink text-cream"
                      : "border-[color:var(--line)] bg-paper text-ink"
                  }`}
                >
                  {v.optionValue ?? v.sku}
                  {out ? " · sold out" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-[2px] border border-[color:var(--line)] bg-paper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg" aria-label="Decrease">−</button>
          <span className="w-8 text-center text-[14px] font-bold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(available, q + 1))} className="px-4 py-3 text-lg" aria-label="Increase">+</button>
        </div>

        <button
          className="btn btn-line flex-1"
          disabled={available <= 0}
          onClick={() => add(line, qty)}
        >
          {available <= 0 ? "Sold Out" : "Add to Bag"}
        </button>
      </div>

      {/* Buy Now goes straight to the single-screen checkout — no drawer, no
          cart page, no review step. */}
      <button
        className="btn btn-gold mt-2.5 w-full"
        disabled={available <= 0}
        onClick={() => { add(line, qty); close(); router.push("/checkout"); }}
      >
        Buy Now
      </button>

      {available > 0 && available <= variant.lowStockAt && (
        <p className="mt-3 text-[12.5px] font-semibold text-maroon">
          Only {available} left in stock.
        </p>
      )}
    </div>
  );
}
