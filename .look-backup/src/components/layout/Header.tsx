"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { Icon } from "@/components/ui/icons";
import { cx, wrap } from "@/lib/styles";

export type NavVertical = {
  id: string; slug: string; name: string; devName: string | null;
  categories: { id: string; slug: string; name: string }[];
};

const iconBtn =
  "grid h-[42px] w-[42px] place-items-center rounded-full transition-colors hover:bg-maroon/[.07]";

/**
 * One row at every width: logo, then navigation, then actions.
 *
 * Search is an icon on desktop as well as mobile — the full-width input was
 * eating the header and pushing the categories onto a second bar. With it gone
 * the category links fit inline, so the whole header is a single 64px strip.
 */
export default function Header({ verticals }: { verticals: NavVertical[] }) {
  const path = usePathname() ?? "/";
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const ui = useUI();
  const [mega, setMega] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-header border-b border-line bg-[#FDF0F1]/95 backdrop-blur-md">
      <div className={cx(wrap, "flex h-16 items-center gap-2")}>
        <button onClick={ui.openMenu} aria-label="Open menu" className={cx(iconBtn, "lg:hidden")}>
          <Icon name="menu" />
        </button>

        <Link href="/" aria-label="Shehnai home" className="flex shrink-0 items-center lg:mr-2">
          <Image src="/logo.png" alt="Shehnai" width={435} height={240} priority
                 className="h-9 w-auto lg:h-11" />
        </Link>

        {/* Category navigation, inline. Hidden below lg, where the drawer and
            the bottom tab bar take over. */}
        <nav aria-label="Collections" className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <NavLink href="/collections/all" active={path === "/collections/all"}>All</NavLink>

          {verticals.map((v) => (
            <div key={v.id} className="relative"
                 onMouseEnter={() => setMega(v.slug)} onMouseLeave={() => setMega(null)}>
              <NavLink href={`/collections/${v.slug}`} active={path.startsWith(`/collections/${v.slug}`)}>
                {v.name}
                {v.categories.length > 0 && <span className="text-[7px] opacity-50">&#9660;</span>}
              </NavLink>

              {v.categories.length > 0 && (
                <div className={cx(
                  "absolute left-1/2 top-full min-w-[240px] -translate-x-1/2 rounded border border-line-gold bg-paper p-2.5 shadow-lift",
                  "transition-all duration-200 ease-silk",
                  mega === v.slug ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
                )}>
                  {v.categories.map((c) => (
                    <Link key={c.id} href={`/collections/${v.slug}?category=${c.slug}`}
                          className="block rounded-[2px] px-3.5 py-2 text-[13.5px] hover:bg-cream hover:text-maroon">
                      {c.name}
                    </Link>
                  ))}
                  <Link href={`/collections/${v.slug}`}
                        className="mt-1.5 block border-t border-line px-3.5 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-maroon">
                    View all {v.name} &rarr;
                  </Link>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0">
          <button onClick={ui.openSearch} aria-label="Search" className={iconBtn}>
            <Icon name="search" />
          </button>
          <Link href="/wishlist" aria-label="Saved pieces" className={iconBtn}>
            <Icon name="heart" />
          </Link>
          <button onClick={ui.openCart} aria-label={`Shopping bag, ${count} items`} className={cx(iconBtn, "relative")}>
            <Icon name="bag" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full border-[1.5px] border-beige bg-maroon px-1 text-[9.5px] font-extrabold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cx(
      "flex h-16 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors xl:px-4 xl:text-[12.5px]",
      active ? "border-maroon text-maroon" : "border-transparent hover:border-maroon hover:text-maroon"
    )}>
      {children}
    </Link>
  );
}
