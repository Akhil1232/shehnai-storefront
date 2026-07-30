import ProductCard from "./ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import type { CardProduct } from "@/types/catalog";

export default function ProductGrid({
  products, emptyAction = true,
}: { products: CardProduct[]; emptyAction?: boolean }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Nothing matches those filters"
        body="Try removing one, or browse the full collection."
        action={emptyAction ? { label: "Browse all jewellery", href: "/collections/all" } : undefined}
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
    </div>
  );
}
