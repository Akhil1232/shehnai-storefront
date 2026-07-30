"use client";

import Link from "next/link";
import { formatINR, discountPercent } from "@/lib/money";
import ProductMedia from "@/components/ui/ProductMedia";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/store/toast";
import { cx, jewelField } from "@/lib/styles";
import type { CardProduct } from "@/types/catalog";

const TAG: Record<string, [string, string]> = {
  NEW: ["bg-forest text-white", "New"],
  BEST: ["bg-gold text-onyx", "Bestseller"],
  LIMITED: ["bg-onyx text-gold-pale", "Limited"],
  SALE: ["bg-maroon text-white", "Sale"],
};

const stars = (r: number) => "\u2605".repeat(Math.round(r)) + "\u2606".repeat(5 - Math.round(r));

export default function ProductCard({ product, priority = false }: { product: CardProduct; priority?: boolean }) {
  const v = product.variants[0];
  const img = product.images[0];
  const d = v ? discountPercent(v.pricePaise, v.mrpPaise) : 0;
  const soldOut = !v || v.stockQty - v.reservedQty <= 0;
  const tag = product.badge !== "NONE" ? TAG[product.badge] : null;

  const saved = useWishlist((s) => s.slugs.includes(product.slug));
  const toggle = useWishlist((s) => s.toggle);
  const toast = useToast((s) => s.show);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded border border-line bg-paper transition-all duration-300 hover:border-gold hover:shadow-card">
      {tag && (
        <span className={cx("absolute left-2.5 top-2.5 z-[2] rounded-[2px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em]", tag[0])}>
          {tag[1]}
        </span>
      )}

      <button
        onClick={() => toast(toggle(product.slug) ? "Saved to wishlist" : "Removed from wishlist")}
        aria-label={saved ? "Remove from saved" : "Save this piece"} aria-pressed={saved}
        className="absolute right-2 top-2 z-[2] grid h-8 w-8 place-items-center rounded-full bg-paper/90 transition-colors hover:bg-white"
      >
        <svg viewBox="0 0 24 24" className={cx("h-4 w-4 stroke-[1.7]", saved ? "fill-maroon stroke-maroon" : "fill-none stroke-ink")}>
          <path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 00-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 000-7.1z" />
        </svg>
      </button>

      <Link href={`/product/${product.slug}`} className={cx(jewelField, "block aspect-square")}>
        <div className="h-full w-full transition-transform duration-500 ease-silk group-hover:scale-[1.06]">
          <ProductMedia url={img?.url} alt={img?.alt || product.name} seed={product.slug}
                        category={product.category?.name ?? product.vertical.name} priority={priority} />
        </div>
        {soldOut && (
          <span className="absolute inset-0 z-[3] grid place-items-center bg-cream/80 text-[11px] font-extrabold uppercase tracking-[0.18em] text-maroon">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3.5 pt-3 md:px-4 md:pb-4">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">
          {product.category?.name ?? product.vertical.name}
        </span>
        <h3 className="my-0.5 font-serif text-[15px] font-semibold leading-tight md:my-1 md:text-[17.5px]">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.reviewCount > 0 && (
          <span className="hidden text-[10.5px] tracking-[1.5px] text-gold sm:block">
            {stars(product.ratingAvg)}
            <b className="ml-1 text-[10.5px] font-semibold tracking-normal text-muted">({product.reviewCount})</b>
          </span>
        )}
        {v && (
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
            <span className="text-[13.5px] font-extrabold text-maroon md:text-[14.5px]">{formatINR(v.pricePaise)}</span>
            {d > 0 && (
              <>
                <span className="text-xs text-faint line-through">{formatINR(v.mrpPaise)}</span>
                <span className="text-[11px] font-extrabold text-forest">{d}% off</span>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
