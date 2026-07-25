"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";

export default function CartDrawer() {
  const { lines, isOpen, close, setQty, remove } = useCart();
  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-[rgba(18,13,10,.5)]" onClick={close} />
      <div className="absolute right-0 top-0 flex h-full w-[min(420px,92vw)] flex-col border-l border-[color:var(--line-gold)] bg-beige">
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-4">
          <b className="font-serif text-xl">
            Your Bag{" "}
            <span className="font-sans text-[12px] text-[color:var(--muted)]">
              ({lines.reduce((n, l) => n + l.qty, 0)})
            </span>
          </b>
          <button onClick={close} aria-label="Close bag" className="text-2xl">×</button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {lines.length === 0 && (
            <p className="py-16 text-center text-[color:var(--muted)]">Your bag is empty.</p>
          )}
          {lines.map((l) => (
            <div key={l.variantId} className="flex gap-3 border-b border-[color:var(--line)] py-4">
              <div className="relative h-20 w-20 flex-none overflow-hidden rounded-[2px] bg-[#1D1712]">
                {l.imageUrl && <Image src={l.imageUrl} alt={l.name} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/product/${l.slug}`} onClick={close} className="font-serif text-[16px]">
                  {l.name}
                </Link>
                {l.variantName && (
                  <p className="text-[11.5px] uppercase tracking-[0.1em] text-[color:var(--muted)]">{l.variantName}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-[2px] border border-[color:var(--line)] bg-paper text-[13px]">
                    <button onClick={() => setQty(l.variantId, l.qty - 1)} className="px-2.5 py-1" aria-label="Decrease">−</button>
                    <span className="w-6 text-center">{l.qty}</span>
                    <button onClick={() => setQty(l.variantId, l.qty + 1)} className="px-2.5 py-1" aria-label="Increase">+</button>
                  </div>
                  <b className="text-[14px] text-maroon">{formatINR(l.pricePaise * l.qty)}</b>
                </div>
                <button
                  onClick={() => remove(l.variantId)}
                  className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)] hover:text-maroon"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-[color:var(--line)] px-5 py-4">
            <div className="mb-3 flex justify-between text-[15px]">
              <span>Subtotal</span>
              <b className="text-maroon">{formatINR(subtotal)}</b>
            </div>
            <Link href="/checkout" onClick={close} className="btn btn-ink w-full">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
