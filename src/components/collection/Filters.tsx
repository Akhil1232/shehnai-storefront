"use client";

import Link from "next/link";
import { useState } from "react";

const PRICE_BANDS = [
  { label: "Under ₹1,000", min: "", max: "1000" },
  { label: "₹1,000 – ₹2,500", min: "1000", max: "2500" },
  { label: "₹2,500 – ₹5,000", min: "2500", max: "5000" },
  { label: "₹5,000+", min: "5000", max: "" },
];

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "rating", label: "Top Rated" },
];

export default function Filters({
  categories,
  basePath,
  active,
}: {
  categories: { id: string; slug: string; name: string }[];
  basePath: string;
  active: { category?: string; sort?: string; min?: string; max?: string };
}) {
  const [open, setOpen] = useState(false);

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { ...active, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      <button
        className="btn btn-line w-full md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide Filters" : "Filters & Sort"}
      </button>

      <aside
        className={`${open ? "block" : "hidden"} rounded-[2px] border border-[color:var(--line)] bg-paper p-5 md:sticky md:top-[98px] md:block`}
      >
        {categories.length > 0 && (
          <div className="border-b border-[color:var(--line)] py-3">
            <b className="mb-2.5 block text-[10.5px] uppercase tracking-[0.16em]">Category</b>
            <Link
              href={href({ category: undefined })}
              className={`block py-1 text-[13px] ${!active.category ? "font-bold text-maroon" : "text-[color:var(--muted)]"}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={href({ category: c.slug })}
                className={`block py-1 text-[13px] ${active.category === c.slug ? "font-bold text-maroon" : "text-[color:var(--muted)]"}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="border-b border-[color:var(--line)] py-3">
          <b className="mb-2.5 block text-[10.5px] uppercase tracking-[0.16em]">Price</b>
          {PRICE_BANDS.map((b) => (
            <Link
              key={b.label}
              href={href({ min: b.min || undefined, max: b.max || undefined })}
              className={`block py-1 text-[13px] ${active.min === b.min && active.max === b.max ? "font-bold text-maroon" : "text-[color:var(--muted)]"}`}
            >
              {b.label}
            </Link>
          ))}
        </div>

        <div className="py-3">
          <b className="mb-2.5 block text-[10.5px] uppercase tracking-[0.16em]">Sort</b>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={href({ sort: s.key })}
              className={`block py-1 text-[13px] ${(active.sort ?? "featured") === s.key ? "font-bold text-maroon" : "text-[color:var(--muted)]"}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <Link href={basePath} className="mt-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-maroon">
          Clear all
        </Link>
      </aside>
    </>
  );
}
