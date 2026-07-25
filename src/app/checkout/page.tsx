"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }
}

const FREE_SHIPPING_AT = 99900;
const FLAT_SHIPPING = 9900;

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [f, setF] = useState({
    name: "", email: "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "",
  });

  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : FLAT_SHIPPING;
  const total = subtotal + shipping;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const valid =
    f.name && f.email.includes("@") && f.phone.length >= 10 &&
    f.line1 && f.city && f.state && /^\d{6}$/.test(f.pincode);

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
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

      if (data.cod) {
        clear();
        router.push(`/order/${data.orderNumber}`);
        return;
      }

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
          if (v.ok) {
            clear();
            router.push(`/order/${data.orderNumber}`);
          } else {
            setError("Payment could not be verified. If money was debited, contact us with your order number.");
          }
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
    return <div className="wrap py-24 text-center text-[color:var(--muted)]">Your bag is empty.</div>;
  }

  const field = "w-full rounded-[2px] border border-[color:var(--line)] bg-paper px-4 py-3 text-[14px]";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="wrap grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="mb-6 text-[clamp(28px,3.6vw,40px)]">Checkout</h1>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em]">Delivery Address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Full name" value={f.name} onChange={set("name")} />
            <input className={field} placeholder="Phone" value={f.phone} onChange={set("phone")} />
            <input className={`${field} sm:col-span-2`} placeholder="Email" value={f.email} onChange={set("email")} />
            <input className={`${field} sm:col-span-2`} placeholder="Address line 1" value={f.line1} onChange={set("line1")} />
            <input className={`${field} sm:col-span-2`} placeholder="Address line 2 (optional)" value={f.line2} onChange={set("line2")} />
            <input className={field} placeholder="City" value={f.city} onChange={set("city")} />
            <input className={field} placeholder="State" value={f.state} onChange={set("state")} />
            <input className={field} placeholder="PIN code" value={f.pincode} onChange={set("pincode")} />
          </div>

          <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.16em]">Payment</h2>
          <div className="grid gap-2">
            {([
              ["RAZORPAY", "Pay online", "UPI · Cards · Net Banking · Wallets"],
              ["COD", "Cash on Delivery", "Available on most PIN codes"],
            ] as const).map(([key, label, sub]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 ${
                  method === key ? "border-gold bg-paper" : "border-[color:var(--line)]"
                }`}
              >
                <input type="radio" name="pay" checked={method === key} onChange={() => setMethod(key)} className="mt-1 accent-[#C9A24B]" />
                <span>
                  <b className="block text-[14px]">{label}</b>
                  <span className="text-[12.5px] text-[color:var(--muted)]">{sub}</span>
                </span>
              </label>
            ))}
          </div>

          {error && <p className="mt-4 text-[13.5px] font-semibold text-maroon">{error}</p>}
        </div>

        <aside className="h-fit rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-6">
          <h2 className="mb-4 font-serif text-2xl">Order Summary</h2>
          {lines.map((l) => (
            <div key={l.variantId} className="flex justify-between gap-3 border-b border-[color:var(--line)] py-2 text-[13.5px]">
              <span>{l.name} × {l.qty}</span>
              <span>{formatINR(l.pricePaise * l.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-[13.5px]">
            <span>Subtotal</span><span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-[color:var(--line)] py-2 text-[13.5px]">
            <span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="flex justify-between py-3 text-[17px]">
            <b>Total</b><b className="text-maroon">{formatINR(total)}</b>
          </div>
          <button onClick={placeOrder} disabled={!valid || busy} className="btn btn-ink w-full disabled:opacity-50">
            {busy ? "Please wait…" : method === "COD" ? "Place Order" : "Pay Now"}
          </button>
          <p className="mt-3 text-center text-[11.5px] text-[color:var(--muted)]">
            Final amount is recalculated on our server before you are charged.
          </p>
        </aside>
      </div>
    </>
  );
}
