"use client";

import { useState } from "react";
import ProductMedia from "@/components/ui/ProductMedia";
import { cx, jewelField } from "@/lib/styles";
import type { ProductImage } from "@prisma/client";

export default function Gallery({
  images, name, slug, category,
}: { images: ProductImage[]; name: string; slug: string; category?: string | null }) {
  const [active, setActive] = useState(0);
  const shots = images.length ? images : [null];
  const current = shots[Math.min(active, shots.length - 1)];

  return (
    <div>
      <div className={cx(jewelField, "aspect-square rounded-lg border border-line-gold")}>
        <ProductMedia url={current?.url} alt={current?.alt || name} seed={slug}
                      category={category} priority sizes="(max-width:900px) 100vw, 46vw" />
      </div>

      {shots.length > 1 && (
        <>
          <div className="mt-2.5 flex gap-2">
            {shots.map((im, i) => (
              <button key={im?.id ?? i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
                      className={cx(jewelField, "aspect-square w-16 rounded-[2px] border transition-colors",
                                    i === active ? "border-2 border-gold" : "border-line")}>
                <ProductMedia url={im?.url} alt="" seed={slug + i} category={category} sizes="66px" />
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex justify-center gap-1.5 md:hidden">
            {shots.map((_, i) => (
              <span key={i} className={cx("h-1.5 rounded-full transition-all",
                                          i === active ? "w-4 bg-maroon" : "w-1.5 bg-line")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
