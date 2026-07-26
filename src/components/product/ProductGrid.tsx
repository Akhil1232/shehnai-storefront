import ProductCard from "./ProductCard";
import type { CardProduct } from "@/types/catalog";

export default function ProductGrid({ products }: { products: CardProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-[color:var(--muted)]">
        Nothing here yet — try another filter.
      </p>
    );
  }
  return (
    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-[14px] md:grid-cols-3 lg:grid-cols-4 lg:gap-[clamp(16px,2vw,28px)]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
