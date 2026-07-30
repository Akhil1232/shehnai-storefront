"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/store/ui";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import { Icon } from "@/components/ui/icons";
import ProductMedia from "@/components/ui/ProductMedia";
import ShipProgress from "@/components/ui/ShipProgress";
import PolicyNote from "@/components/ui/PolicyNote";
import EmptyState from "@/components/ui/EmptyState";
import QtyStepper from "@/components/ui/QtyStepper";
import { btn, btnFull, btnSm, cx, backdrop as backdropCls, panelBase, jewelField } from "@/lib/styles";
import type { NavVertical } from "@/components/layout/Header";

/**
 * All overlays live here so exactly one can be open at a time (see store/ui).
 * Each is `fixed` at the `panel` z-layer, above `backdrop`, which is above
 * `tabbar` — the ordering is named in tailwind.config.ts rather than guessed
 * per component, which is what previously let things stack wrongly.
 */
export default function Overlays({
  verticals, freeShippingAt,
}: { verticals: NavVertical[]; freeShippingAt: number }) {
  const { overlay, close } = useUI();

  useEffect(() => {
    document.body.style.overflow = overlay ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <>
      <div onClick={close} aria-hidden
           className={cx(backdropCls, overlay ? "visible opacity-100" : "invisible opacity-0")} />
      <MenuDrawer verticals={verticals} />
      <CartPanel freeShippingAt={freeShippingAt} />
      <SearchOverlay verticals={verticals} />
    </>
  );
}

const panelHead = "flex flex-none items-center justify-between border-b border-line px-4 py-4";
const panelTitle = "font-serif text-[22px] font-semibold";

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Close" className="p-1 text-muted hover:text-maroon">
      <Icon name="close" />
    </button>
  );
}

/* ------------------------------------------------------------------ menu -- */

function MenuDrawer({ verticals }: { verticals: NavVertical[] }) {
  const { overlay, close } = useUI();
  const [group, setGroup] = useState<string | null>(null);
  const open = overlay === "menu";

  return (
    <aside aria-label="Browse" aria-hidden={!open}
           className={cx(panelBase, "left-0 overflow-y-auto border-r border-line-gold",
                         open ? "translate-x-0" : "-translate-x-full")}>
      <div className={panelHead}>
        <span className={panelTitle}>Browse</span>
        <CloseButton onClick={close} />
      </div>

      <Link href="/collections/all" onClick={close}
            className="border-b border-line px-4 py-4 font-serif text-xl font-semibold">
        All Jewellery
      </Link>

      {verticals.map((v) => {
        const isOpen = group === v.slug;
        return (
          <div key={v.id} className="border-b border-line">
            <button onClick={() => setGroup(isOpen ? null : v.slug)} aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-4 py-4 text-left font-serif text-xl font-semibold">
              <span>
                {v.name}
                {v.devName && <span className="block font-dev text-xs text-maroon">{v.devName}</span>}
              </span>
              <span className={cx("text-[11px] text-gold-deep transition-transform", isOpen && "rotate-180")}>
                &#9660;
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3">
                {v.categories.map((c) => (
                  <Link key={c.id} href={`/collections/${v.slug}?category=${c.slug}`} onClick={close}
                        className="block border-l border-line-gold py-2 pl-3 text-[13.5px] text-muted hover:text-maroon">
                    {c.name}
                  </Link>
                ))}
                <Link href={`/collections/${v.slug}`} onClick={close}
                      className="block border-l border-line-gold py-2 pl-3 text-[13.5px] font-bold text-maroon">
                  View all &rarr;
                </Link>
              </div>
            )}
          </div>
        );
      })}

      <div className="p-4">
        <Link href="/policies/shipping" onClick={close} className="block py-1.5 text-[13.5px] text-muted">Shipping Policy</Link>
        <Link href="/policies/returns" onClick={close} className="block py-1.5 text-[13.5px] text-muted">Replacement Policy</Link>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ cart -- */

function CartPanel({ freeShippingAt }: { freeShippingAt: number }) {
  const { overlay, close } = useUI();
  const { lines, setQty, remove } = useCart();
  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const open = overlay === "cart";

  return (
    <aside aria-label="Shopping bag" aria-hidden={!open}
           className={cx(panelBase, "right-0 border-l border-line-gold",
                         open ? "translate-x-0" : "translate-x-full")}>
      <div className={panelHead}>
        <span className={panelTitle}>
          Your Bag <span className="text-[13.5px] font-normal text-muted">({count})</span>
        </span>
        <CloseButton onClick={close} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {lines.length === 0 ? (
          <EmptyState icon="bag" title="Your bag is empty"
                      body="Once you add something, it will show up here."
                      action={{ label: "Start shopping", href: "/collections/all" }} />
        ) : (
          <>
            <ShipProgress subtotal={subtotal} threshold={freeShippingAt} />
            {lines.map((l) => (
              <div key={l.variantId} className="flex gap-3 border-b border-line py-4 last:border-0">
                <Link href={`/product/${l.slug}`} onClick={close}
                      className={cx(jewelField, "h-20 w-20 flex-none rounded-[2px] border border-line")}>
                  <ProductMedia url={l.imageUrl} alt={l.name} seed={l.slug} sizes="80px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-[15px] font-semibold">{l.name}</h4>
                  {l.variantName && <p className="text-[11.5px] text-muted">{l.variantName}</p>}
                  <QtyStepper qty={l.qty} onChange={(q) => setQty(l.variantId, q)} small />
                </div>
                <div className="flex-none text-right">
                  <b className="text-[13.5px] text-maroon">{formatINR(l.pricePaise * l.qty)}</b>
                  <button onClick={() => remove(l.variantId)}
                          className="mt-2 block text-[10.5px] font-bold uppercase tracking-[0.1em] text-faint hover:text-maroon">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4"><PolicyNote compact /></div>
          </>
        )}
      </div>

      {lines.length > 0 && (
        <div className="flex-none border-t border-line bg-cream px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <div className="mb-2.5 flex justify-between text-[17px] font-extrabold">
            <span>Total</span><b className="text-maroon">{formatINR(subtotal)}</b>
          </div>
          <Link href="/checkout" onClick={close} className={cx(btn.primary, btnFull)}>Checkout</Link>
          <Link href="/cart" onClick={close} className={cx(btn.ghost, btnSm, btnFull, "mt-2")}>View full bag</Link>
        </div>
      )}
    </aside>
  );
}

/* ---------------------------------------------------------------- search -- */

type Suggestion = { slug: string; name: string; category: string; pricePaise: number; image: string | null };

const POPULAR = ["Kundan brooch", "Swagat set", "Pearl mala", "Jhumka", "Murti necklace", "Kalgi"];
const chip = "mb-2 mr-2 inline-block rounded-full border border-line-gold bg-paper px-3.5 py-2 text-[12.5px] hover:border-gold";

function SearchOverlay({ verticals }: { verticals: NavVertical[] }) {
  const { overlay, close } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const open = overlay === "search";

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) { setHits([]); setBusy(false); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        setHits(res.ok ? await res.json() : []);
      } catch { setHits([]); }
      setBusy(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => { if (!open) { setQ(""); setHits([]); } }, [open]);

  function submit() {
    if (!q.trim()) return;
    close();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  if (!open) return null;

  return (
    <div aria-label="Search" className="fixed inset-0 z-panel flex flex-col bg-beige">
      <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
        <button onClick={close} aria-label="Back"
                className="grid h-[42px] w-[42px] place-items-center rounded-full hover:bg-maroon/[.07]">
          <Icon name="back" />
        </button>
        <input
          autoFocus type="search" value={q} aria-label="Search products"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search for malas, brooches, kalgi…"
          className="h-11 flex-1 rounded-full border border-line bg-paper px-4 text-sm outline-none focus:border-gold"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {q.trim().length < 2 ? (
          <>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-muted">Popular searches</p>
            {POPULAR.map((t) => <button key={t} onClick={() => setQ(t)} className={chip}>{t}</button>)}
            <p className="mb-3 mt-5 text-[11px] font-bold uppercase tracking-[0.13em] text-muted">Shop by collection</p>
            {verticals.map((v) => (
              <Link key={v.id} href={`/collections/${v.slug}`} onClick={close} className={chip}>{v.name}</Link>
            ))}
          </>
        ) : hits.length ? (
          hits.map((h) => (
            <Link key={h.slug} href={`/product/${h.slug}`} onClick={close}
                  className="flex items-center gap-3 border-b border-line py-2.5">
              <span className={cx(jewelField, "h-[52px] w-[52px] flex-none rounded-[2px]")}>
                <ProductMedia url={h.image} alt={h.name} seed={h.slug} category={h.category} sizes="52px" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block font-serif text-base">{h.name}</b>
                <span className="text-[13.5px] text-muted">{h.category}</span>
              </span>
              <b className="text-maroon">{formatINR(h.pricePaise)}</b>
            </Link>
          ))
        ) : (
          <p className="py-10 text-center text-[13.5px] text-muted">
            {busy ? "Searching…" : `No matches for “${q}”. Try “brooch” or “mala”.`}
          </p>
        )}
      </div>
    </div>
  );
}
