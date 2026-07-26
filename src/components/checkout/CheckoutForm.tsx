"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import PolicyNote from "@/components/ui/PolicyNote";

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }
}

const SAVED = "shehnai-address";

type Form = {
  name: string; phone: string; email: string;
  pincode: string; city: string; state: string;
  line1: string; line2: string;
};

const EMPTY: Form = { name: "", phone: "", email: "", pincode: "", city: "", state: "", line1: "", line2: "" };

export default function CheckoutForm({
  freeShippingAt, flatShipping, codEnabled, codFee,
}: {
  freeShippingAt: number; flatShipping: number; codEnabled: boolean; codFee: number;
}) {
  const router = useRouter();
  const { lines, clear, setQty } = useCart();

  const [f, setF] = useState<Form>(EMPTY);
  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinState, setPinState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [hasSaved, setHasSaved] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const lineRef = useRef<HTMLInputElement>(null);

  /* Returning customers should never type their address twice. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED);
      if (raw) { setF({ ...EMPTY, ...JSON.parse(raw) }); setHasSaved(true); setPinState("ok"); }
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  /**
   * PIN code fills city and state automatically — two fewer fields to type,
   * and it catches typos before the parcel is packed.
   */
  async function onPincode(e: React.ChangeEvent<HTMLInputElement>) {
    const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
    setF((p) => ({ ...p, pincode }));
    if (pincode.length !== 6) { setPinState("idle"); return; }

    setPinState("loading");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const [data] = await res.json();
      const po = data?.PostOffice?.[0];
      if (data?.Status === "Success" && po) {
        setF((p) => ({ ...p, city: po.District, state: po.State }));
        setPinState("ok");
        lineRef.current?.focus();
      } else setPinState("fail");
    } catch { setPinState("fail"); }
  }

  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const shipping = subtotal >= freeShippingAt ? 0 : flatShipping;
  const fee = method === "COD" ? codFee : 0;
  const total = subtotal + shipping + fee;
  const away = freeShippingAt - subtotal;

  const valid =
    f.name.trim().length > 1 &&
    /^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "")) &&
    f.email.includes("@") &&
    /^\d{6}$/.test(f.pincode) &&
    f.city && f.state && f.line1.trim().length > 4;

  async function placeOrder() {
    setBusy(true); setError(null);
    try {
      localStorage.setItem(SAVED, JSON.stringify(f));

      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          email: f.email,
          phone: f.phone,
          address: {
            name: f.name, phone: f.phone, line1: f.line1, line2: f.line2,
            city: f.city, state: f.state, pincode: f.pincode,
          },
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");

      if (data.cod) { clear(); router.push(`/order/${data.orderNumber}`); return; }

      const rz = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Shehnai®",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { name: f.name, email: f.email, contact: f.phone },
        theme: { color: "#8A2226" },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          });
          if (v.ok) { clear(); router.push(`/order/${data.orderNumber}`); }
          else setError("Payment could not be verified. If money was debited, contact us with your order number.");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="wrap py-24 text-center">
        <p className="mb-6 text-[color:var(--muted)]">Your bag is empty.</p>
        <Link href="/collections/all" className="btn btn-gold">Explore the Collection</Link>
      </div>
    );
  }

  const field =
    "w-full rounded-[2px] border border-[color:var(--line)] bg-paper px-3.5 py-3 text-[14px] outline-none focus:border-gold";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="wrap max-w-[960px] pb-40 pt-6 sm:pb-12 sm:pt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-[26px] sm:text-[34px]">Checkout</h1>
          <Link href="/collections/all" className="text-[12px] text-maroon">Add more →</Link>
        </div>

        {/* ---- collapsible order summary: one tap, no separate cart page ---- */}
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="mb-4 flex w-full items-center justify-between rounded-[2px] border border-[color:var(--line-gold)] bg-paper px-4 py-3 text-left"
        >
          <span className="text-[13px]">
            <b>{lines.reduce((n, l) => n + l.qty, 0)} item{lines.length > 1 ? "s" : ""}</b>
            <span className="text-[color:var(--muted)]"> · {formatINR(total)}</span>
          </span>
          <span className="text-[12px] text-maroon">{showSummary ? "Hide" : "View"} ▾</span>
        </button>

        {showSummary && (
          <div className="mb-5 rounded-[2px] border border-[color:var(--line)] bg-paper p-4">
            {lines.map((l) => (
              <div key={l.variantId} className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5 last:border-0">
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-[2px] bg-[#1D1712]">
                  {l.imageUrl && <Image src={l.imageUrl} alt={l.name} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[15px]">{l.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <button onClick={() => setQty(l.variantId, l.qty - 1)} className="rounded border border-[color:var(--line)] px-2 text-[13px]" aria-label="Decrease">−</button>
                    <span className="text-[12.5px]">{l.qty}</span>
                    <button onClick={() => setQty(l.variantId, l.qty + 1)} className="rounded border border-[color:var(--line)] px-2 text-[13px]" aria-label="Increase">+</button>
                  </div>
                </div>
                <b className="text-[13.5px] text-maroon">{formatINR(l.pricePaise * l.qty)}</b>
              </div>
            ))}
          </div>
        )}

        {away > 0 && (
          <p className="mb-4 rounded-[2px] bg-[#E7D3B1] px-3 py-2 text-center text-[12px] text-ink">
            Add {formatINR(away)} more for free shipping.
          </p>
        )}

        {hasSaved && (
          <p className="mb-3 text-[12px] text-[color:var(--muted)]">
            Using your saved details — edit anything below if it has changed.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-[1fr_300px]">
          <div>
            {/* -------- contact + address, one screen, PIN-first ------------- */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <input className={field} placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" />
              <input className={field} placeholder="10-digit mobile number" value={f.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel" />
              <input className={`${field} sm:col-span-2`} placeholder="Email (for your order confirmation)" value={f.email} onChange={set("email")} type="email" autoComplete="email" />

              <div>
                <input className={field} placeholder="PIN code" value={f.pincode} onChange={onPincode} inputMode="numeric" autoComplete="postal-code" />
                {pinState === "loading" && <span className="mt-1 block text-[11.5px] text-[color:var(--muted)]">Looking up…</span>}
                {pinState === "fail" && <span className="mt-1 block text-[11.5px] text-maroon">Couldn&apos;t find that PIN — type your city and state below.</span>}
              </div>
              <input className={field} placeholder="City" value={f.city} onChange={set("city")} autoComplete="address-level2" />
              <input className={`${field} sm:col-span-2`} ref={lineRef} placeholder="Flat / house no., building, street" value={f.line1} onChange={set("line1")} autoComplete="address-line1" />
              <input className={field} placeholder="Area / landmark (optional)" value={f.line2} onChange={set("line2")} autoComplete="address-line2" />
              <input className={field} placeholder="State" value={f.state} onChange={set("state")} autoComplete="address-level1" />
            </div>

            {/* --------------------------- payment -------------------------- */}
            <div className="mt-6 grid gap-2">
              {([
                ["RAZORPAY", "Pay online", "UPI · Cards · Net Banking · Wallets"],
                ...(codEnabled ? [["COD", "Cash on Delivery", codFee > 0 ? `+ ${formatINR(codFee)} handling` : "Available on most PIN codes"] as const] : []),
              ] as const).map(([key, label, sub]) => (
                <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-3.5 ${method === key ? "border-gold bg-paper" : "border-[color:var(--line)]"}`}>
                  <input type="radio" name="pay" checked={method === key} onChange={() => setMethod(key as "RAZORPAY" | "COD")} className="mt-1 accent-[#8A2226]" />
                  <span>
                    <b className="block text-[14px]">{label}</b>
                    <span className="text-[12.5px] text-[color:var(--muted)]">{sub}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5"><PolicyNote /></div>
            {error && <p className="mt-4 text-[13.5px] font-semibold text-maroon">{error}</p>}
          </div>

          {/* ------------- desktop summary; mobile uses the sticky bar ------- */}
          <aside className="hidden h-fit rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-5 sm:block">
            <div className="flex justify-between py-1 text-[13.5px]"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between py-1 text-[13.5px]"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
            {fee > 0 && <div className="flex justify-between py-1 text-[13.5px]"><span>COD fee</span><span>{formatINR(fee)}</span></div>}
            <div className="mt-2 flex justify-between border-t border-[color:var(--line)] pt-3 text-[17px]">
              <b>Total</b><b className="text-maroon">{formatINR(total)}</b>
            </div>
            <button onClick={placeOrder} disabled={!valid || busy} className="btn btn-ink mt-4 w-full disabled:opacity-50">
              {busy ? "Please wait…" : method === "COD" ? "Place Order" : `Pay ${formatINR(total)}`}
            </button>
            <p className="mt-2.5 text-center text-[11px] text-[color:var(--muted)]">
              Amount is recalculated on our server before you are charged.
            </p>
          </aside>
        </div>
      </div>

      {/* ---- mobile: pay button always in reach, never a scroll away ------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line-gold)] bg-beige/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mb-2 flex justify-between text-[13px]">
          <span className="text-[color:var(--muted)]">Total {shipping === 0 ? "· free shipping" : `incl. ${formatINR(shipping)} shipping`}</span>
          <b className="text-maroon">{formatINR(total)}</b>
        </div>
        <button onClick={placeOrder} disabled={!valid || busy} className="btn btn-ink w-full disabled:opacity-50">
          {busy ? "Please wait…" : method === "COD" ? "Place Order" : `Pay ${formatINR(total)}`}
        </button>
      </div>
    </>
  );
}
