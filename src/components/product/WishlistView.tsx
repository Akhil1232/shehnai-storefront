"use client";

import { useEffect, useState } from "react";
import ProductGrid from "./ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import { useWishlist } from "@/store/wishlist";
import { wrap } from "@/lib/styles";
import type { CardProduct } from "@/types/catalog";

export default function WishlistView({ products }: { products: CardProduct[] }) {
  const slugs = useWishlist((s) => s.slugs);
  // The persisted store is only correct after mount, so hold the first paint
  // to avoid a hydration mismatch.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const saved = ready ? products.filter((p) => slugs.includes(p.slug)) : [];

  return (
    <div className={wrap}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Saved" }]} />
      <div className="border-b border-line pb-4">
        <h1 className="text-h1">Saved pieces</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          {ready ? `${saved.length} item${saved.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
      </div>
      <div className="py-5 pb-12">
        {!ready ? null : saved.length ? <ProductGrid products={saved} /> : (
          <EmptyState icon="heart" title="Nothing saved yet"
                      body="Tap the heart on any piece to keep it here."
                      action={{ label: "Start browsing", href: "/collections/all" }} />
        )}
      </div>
    </div>
  );
}
