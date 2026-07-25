"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@prisma/client";

/** Product image spec: 2000x2000 (1:1), min 1200x1200 so zoom stays sharp. */
export default function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return <div className="aspect-square rounded-[2px] bg-[#1D1712]" />;
  }
  const img = images[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[2px] border border-[color:var(--line-gold)] bg-[#1D1712]">
        <Image
          src={img.url}
          alt={img.alt || name}
          fill
          priority
          sizes="(max-width:880px) 100vw, 50vw"
          className="object-cover"
        />
        {img.isStudioPhoto && (
          <span className="absolute bottom-3 left-3 rounded-[2px] border border-[color:var(--line-gold)] bg-[rgba(18,13,10,.85)] px-2 py-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#E9CB84]">
            Studio photo
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((im, i) => (
            <button
              key={im.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-[2px] border ${
                i === active ? "border-gold" : "border-[color:var(--line)]"
              }`}
            >
              <Image src={im.url} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
