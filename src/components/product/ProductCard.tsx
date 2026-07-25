import Image from "next/image";
import Link from "next/link";
import { formatINR, discountPercent } from "@/lib/money";
import type { CardProduct } from "@/types/catalog";

const BADGE_STYLE: Record<string, string> = {
  NEW: "bg-emerald text-white border-emerald",
  SALE: "bg-maroon text-white border-maroon",
  BEST: "bg-paper text-ink border-[color:var(--line-gold)]",
  LIMITED: "bg-onyx text-[#E9CB84] border-[color:var(--line-gold)]",
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const v = product.variants[0];
  const img = product.images[0];
  const off = v ? discountPercent(v.pricePaise, v.mrpPaise) : 0;
  const soldOut = !v || v.stockQty - v.reservedQty <= 0;

  return (
    <article className="card-surface group flex flex-col hover:shadow-[0_16px_40px_rgba(0,0,0,.16)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-[#1D1712]">
        {img && (
          <Image
            src={img.url}
            alt={img.alt || product.name}
            fill
            sizes="(max-width:760px) 50vw, (max-width:1020px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.045]"
          />
        )}
        {product.badge !== "NONE" && (
          <span
            className={`absolute left-3 top-3 z-[2] rounded-[2px] border px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] ${
              BADGE_STYLE[product.badge] ?? BADGE_STYLE.BEST
            }`}
          >
            {product.badge}
          </span>
        )}
        {img?.isStudioPhoto && (
          <span className="absolute bottom-3 left-3 z-[2] rounded-[2px] border border-[color:var(--line-gold)] bg-[rgba(18,13,10,.85)] px-2 py-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#E9CB84]">
            Studio photo
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 z-[3] grid place-items-center bg-[rgba(18,13,10,.55)] text-[11px] font-bold uppercase tracking-[0.2em] text-cream">
            Sold out
          </span>
        )}
      </Link>

      <div className="px-4 pb-[18px] pt-[15px]">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          {product.category?.name ?? product.vertical.name}
        </span>
        <h3 className="my-1 font-serif text-[18.5px] font-semibold">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.reviewCount > 0 && (
          <div className="text-[11px] tracking-[2px] text-gold">
            {"★".repeat(Math.round(product.ratingAvg))}
            <span className="ml-1.5 text-[color:var(--muted)]">({product.reviewCount})</span>
          </div>
        )}
        {v && (
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <b className="text-[15px] font-bold text-maroon">{formatINR(v.pricePaise)}</b>
            {off > 0 && (
              <>
                <s className="text-[12.5px] text-[rgba(36,28,21,.4)]">{formatINR(v.mrpPaise)}</s>
                <span className="text-[11px] font-bold text-maroon">{off}% off</span>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
