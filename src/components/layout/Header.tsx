"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/store/cart";

type NavVertical = {
  id: string;
  slug: string;
  name: string;
  categories: { id: string; slug: string; name: string }[];
};

export default function Header({ verticals }: { verticals: NavVertical[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const openCart = useCart((s) => s.open);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[rgba(240,229,203,0.92)] backdrop-blur-[10px]">
      <div className="wrap flex h-[78px] items-center justify-between gap-4">
        <Link href="/" aria-label="Shehnai home" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Shehnai"
            width={160}
            height={48}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-[clamp(10px,1.6vw,22px)] lg:flex">
          {verticals.map((v) => (
            <div
              key={v.id}
              className="relative"
              onMouseEnter={() => setOpenSlug(v.slug)}
              onMouseLeave={() => setOpenSlug(null)}
            >
              <Link
                href={`/collections/${v.slug}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap py-2.5 text-[11.5px] font-bold uppercase tracking-[0.11em] text-ink hover:text-maroon"
              >
                {v.name}
                {v.categories.length > 0 && <span className="text-[9px] opacity-65">▾</span>}
              </Link>
              {openSlug === v.slug && v.categories.length > 0 && (
                <div className="absolute left-1/2 top-full min-w-[220px] -translate-x-1/2 rounded-[2px] border border-[color:var(--line-gold)] bg-paper py-3.5 shadow-[0_20px_44px_rgba(36,28,21,.14)]">
                  <Link
                    href={`/collections/${v.slug}`}
                    className="mb-1.5 block border-b border-[color:var(--line)] px-[22px] pb-3 text-[12px] font-bold uppercase tracking-[0.07em] text-maroon"
                  >
                    All {v.name}
                  </Link>
                  {v.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${v.slug}?category=${c.slug}`}
                      className="block px-[22px] py-2.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-ink hover:bg-cream hover:text-maroon"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-2.5 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <span className="relative block h-[13px] w-[22px]">
              <span className="absolute left-0 right-0 top-0 h-[1.4px] bg-gold" />
              <span className="absolute left-0 right-0 top-[6px] h-[1.4px] bg-gold" />
              <span className="absolute left-0 right-0 top-[12px] h-[1.4px] bg-gold" />
            </span>
            Menu
          </button>

          <button
            onClick={openCart}
            aria-label="Shopping bag"
            className="relative grid h-[42px] w-[42px] place-items-center rounded-full hover:bg-[rgba(124,21,24,0.06)]"
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-none stroke-ink stroke-[1.5]">
              <path d="M6 8h12l1 12H5L6 8z" />
              <path d="M9 8V6a3 3 0 016 0v2" />
            </svg>
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-lg bg-maroon px-1 text-[9.5px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* mobile nav */}
      {mobileOpen && (
        <div className="border-t border-[color:var(--line)] bg-cream lg:hidden">
          <div className="wrap py-4">
            {verticals.map((v) => (
              <div key={v.id} className="border-b border-[color:var(--line)] py-3">
                <Link
                  href={`/collections/${v.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block font-serif text-[26px] text-ink"
                >
                  {v.name}
                </Link>
                <div className="flex flex-wrap gap-x-4">
                  {v.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${v.slug}?category=${c.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
