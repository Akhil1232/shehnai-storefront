"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);

  return (
    <div className="wrap py-12">
      <h1 className="mb-8 text-[clamp(28px,3.6vw,42px)]">Your Bag</h1>

      {lines.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-6 text-[color:var(--muted)]">Your bag is empty.</p>
          <Link href="/collections/all" className="btn btn-gold">Explore the Collection</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            {lines.map((l) => (
              <div key={l.variantId} className="flex gap-4 border-b border-[color:var(--line)] py-5">
                <div className="relative h-28 w-28 flex-none overflow-hidden rounded-[2px] bg-[#1D1712]">
                  {l.imageUrl && <Image src={l.imageUrl} alt={l.name} fill sizes="112px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <Link href={`/product/${l.slug}`} className="font-serif text-[20px]">{l.name}</Link>
                  <p className="text-[11.5px] uppercase tracking-[0.1em] text-[color:var(--muted)]">
                    {l.variantName ?? l.sku}
                  </p>
                  <div className="mt-3 flex items-center gap-5">
                    <div className="flex items-center rounded-[2px] border border-[color:var(--line)] bg-paper">
                      <button onClick={() => setQty(l.variantId, l.qty - 1)} className="px-3 py-1.5" aria-label="Decrease">−</button>
                      <span className="w-7 text-center text-[14px]">{l.qty}</span>
                      <button onClick={() => setQty(l.variantId, l.qty + 1)} className="px-3 py-1.5" aria-label="Increase">+</button>
                    </div>
                    <button onClick={() => remove(l.variantId)} className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)] hover:text-maroon">
                      Remove
                    </button>
                  </div>
                </div>
                <b className="text-[16px] text-maroon">{formatINR(l.pricePaise * l.qty)}</b>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-6">
            <h2 className="mb-4 font-serif text-2xl">Summary</h2>
            <div className="flex justify-between border-b border-[color:var(--line)] py-2 text-[14px]">
              <span>Subtotal</span>
              <b>{formatINR(subtotal)}</b>
            </div>
            <p className="py-3 text-[12.5px] text-[color:var(--muted)]">
              Shipping calculated at checkout. Free over ₹999.
            </p>
            <Link href="/checkout" className="btn btn-ink w-full">Proceed to Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
