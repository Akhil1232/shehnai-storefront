"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx } from "@/lib/styles";

/**
 * Mobile tab bar — the pattern Indian shoppers already know from Nykaa and
 * Myntra. Height is `tabbar` (56px) in the Tailwind spacing scale; anything
 * that must sit above it references that same token, so nothing overlaps.
 */
const item = "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-[9.5px] font-bold uppercase tracking-[0.07em] transition-colors";

export default function BottomNav() {
  const path = usePathname() ?? "/";
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const ui = useUI();
  const on = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  const Tab = ({ href, icon, label, active }: { href: string; icon: IconName; label: string; active: boolean }) => (
    <Link href={href} className={cx(item, active ? "text-maroon" : "text-muted")}>
      <Icon name={icon} className="h-[21px] w-[21px]" /><span>{label}</span>
    </Link>
  );

  return (
    <nav aria-label="Primary"
         className="fixed inset-x-0 bottom-0 z-tabbar flex h-tabbar border-t border-line bg-[#F3E9D3]/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <Tab href="/" icon="home" label="Home" active={on("/")} />
      <Tab href="/collections/all" icon="grid" label="Shop" active={on("/collections")} />
      <button onClick={ui.openSearch} className={cx(item, "text-muted")}>
        <Icon name="search" className="h-[21px] w-[21px]" /><span>Search</span>
      </button>
      <Tab href="/wishlist" icon="heart" label="Saved" active={on("/wishlist")} />
      <button onClick={ui.openCart} className={cx(item, "text-muted")}>
        <Icon name="bag" className="h-[21px] w-[21px]" /><span>Bag</span>
        {count > 0 && (
          <span className="absolute right-[calc(50%-20px)] top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-maroon px-1 text-[9px] font-extrabold text-white">
            {count}
          </span>
        )}
      </button>
    </nav>
  );
}
