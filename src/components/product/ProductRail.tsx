import ProductCard from "./ProductCard";
import type { CardProduct } from "@/types/catalog";

/** Horizontal scroller, so the homepage stays short. */
export default function ProductRail({ products }: { products: CardProduct[] }) {
  if (!products.length) return null;
  return (
    <div className="no-bar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1.5">
      {products.map((p) => (
        <div key={p.id} className="w-[clamp(150px,44vw,240px)] flex-none snap-start md:w-[250px]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
