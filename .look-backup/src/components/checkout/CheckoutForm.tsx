"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/money";
import StepBar from "@/components/ui/StepBar";
import PolicyNote from "@/components/ui/PolicyNote";
import EmptyState from "@/components/ui/EmptyState";
import { btn, btnFull, cx, input, inputError, label as labelCls, summaryRow, summaryTotal, wrap } from "@/lib/styles";

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }
}

const SAVED = "shehnai-address";

type Form = {
  name: string; phone: string; email: string;
  pincode: string; city: string; state: string; line1: string; line2: string;
};
const EMPTY: Form = { name: "", phone: "", email: "", pincode: "", city: "", state: "", line1: "", line2: "" };

const CHECKS: [keyof Form, (v: string) => boolean, string][] = [
  ["name", (v) => v.trim().length > 1, "Please enter your name"],
  ["phone", (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")), "Enter a valid 10-digit mobile number"],
  ["email", (v) => /\S+@\S+\.\S+/.test(v), "Please enter a valid email"],
  ["pincode", (v) => /^\d{6}$/.test(v.replace(/\D/g, "")), "Enter a valid 6-digit PIN code"],
  ["line1", (v) => v.trim().length > 4, "Please enter your address"],
];

export default function CheckoutForm({
  freeShippingAt, flatShipping, codEnabled, codFee,
}: { freeShippingAt: number; flatShipping: number; codEnabled: boolean; codFee: number }) {
  const router = useRouter();
  const { lines, clear } = useCart();

  const [f, setF] = useState<Form>(EMPTY);
  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinNote, setPinNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [bad, setBad] = useState<Set<keyof Form>>(new Set());
  const line1Ref = useRef<HTMLInputElement>(null);

  /* Returning customers should never type their address twice. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED);
      if (raw) setF({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setBad((b) => { const n = new Set(b); n.delete(k); return n; });
  };

  /* PIN fills city and state — two fewer fields, and it catches typos early. */
  async function onPincode(e: React.ChangeEvent<HTMLInputElement>) {
    const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
    setF((p) => ({ ...p, pincode }));
    setBad((b) => { const n = new Set(b); n.delete("pincode"); return n; });
    if (pincode.length !== 6) { setPinNote(null); return; }

    setPinNote({ ok: true, text: "Looking up…" });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const [data] = await res.json();
      const po = data?.PostOffice?.[0];
      if (data?.Status === "Success" && po) {
        setF((p) => ({ ...p, city: po.District, state: po.State }));
        setPinNote({ ok: true, text: `✓ ${po.District}, ${po.State}` });
        line1Ref.current?.focus();
      } else setPinNote({ ok: false, text: "Please fill city and state yourself." });
    } catch { setPinNote({ ok: false, text: "Please fill city and state yourself." }); }
  }

  const subtotal = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0);
  const shipping = subtotal >= freeShippingAt ? 0 : flatShipping;
  const fee = method === "COD" ? codFee : 0;
  const total = subtotal + shipping + fee;

  async function placeOrder() {
    const failed = new Set<keyof Form>();
    CHECKS.forEach(([k, ok]) => { if (!ok(f[k])) failed.add(k); });
    if (failed.size) {
      setBad(failed);
      setError("Please check the highlighted fields.");
      const first = document.getElementById(`f-${[...failed][0]}`);
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus();
      return;
    }

    setBusy(true); setError(null);
    try {
      localStorage.setItem(SAVED, JSON.stringify(f));
      const res = await fetch("/api/checkout/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          email: f.email, phone: f.phone,
          address: { name: f.name, phone: f.phone, line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");

      if (data.cod) { clear(); router.push(`/order/${data.orderNumber}`); return; }

      const rz = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: "INR",
        name: "Shehnai®", description: `Order ${data.orderNumber}`, order_id: data.razorpayOrderId,
        prefill: { name: f.name, email: f.email, contact: f.phone },
        theme: { color: "#8A2226" },
        handler: async (r: Record<string, string>) => {
          const v = await fetch("/api/checkout/verify", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r),
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

  if (!lines.length) {
    return (
      <div className={wrap}>
        <EmptyState icon="bag" title="Your bag is empty"
                    body="Add something first, then come back here."
                    action={{ label: "Start shopping", href: "/collections/all" }} />
      </div>
    );
  }

  const Field = ({ k, label, err, ...rest }: {
    k: keyof Form; label: string; err?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`f-${k}`} className={labelCls}>{label}</label>
      <input id={`f-${k}`} value={f[k]} onChange={set(k)}
             className={cx(input, bad.has(k) && inputError)} {...rest} />
      {bad.has(k) && err && <span className="mt-1 block text-[11.5px] text-maroon">{err}</span>}
    </div>
  );

  const block = "mb-4 rounded border border-line bg-paper p-4.5";
  const blockTitle = "mb-3.5 flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.13em]";
  const stepDot = "grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-maroon text-[11px] not-italic text-white";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* pb leaves room for the sticky pay bar, which sits above the tab bar. */}
      <div className={cx(wrap, "pb-40 lg:pb-12")}>
        <StepBar current={2} />
        <h1 className="mb-4 mt-2.5 text-center text-h1">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px] lg:gap-9">
          <div>
            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>1</i>Contact</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field k="name" label="Full name" autoComplete="name" placeholder="Your name" err={CHECKS[0][2]} />
                <Field k="phone" label="Mobile number" inputMode="numeric" maxLength={10}
                       autoComplete="tel" placeholder="10-digit number" err={CHECKS[1][2]} />
                <div className="sm:col-span-2">
                  <Field k="email" label="Email" type="email" autoComplete="email"
                         placeholder="For your order confirmation" err={CHECKS[2][2]} />
                </div>
              </div>
            </div>

            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>2</i>Delivery address</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-pincode" className={labelCls}>PIN code</label>
                  <input id="f-pincode" value={f.pincode} onChange={onPincode} inputMode="numeric"
                         maxLength={6} autoComplete="postal-code" placeholder="6 digits"
                         className={cx(input, bad.has("pincode") && inputError)} />
                  {bad.has("pincode") && <span className="mt-1 block text-[11.5px] text-maroon">{CHECKS[3][2]}</span>}
                  {pinNote && (
                    <span className={cx("mt-1 block text-[11.5px]", pinNote.ok ? "text-forest" : "text-muted")}>
                      {pinNote.text}
                    </span>
                  )}
                </div>
                <Field k="city" label="City" autoComplete="address-level2" placeholder="Auto-filled from PIN" />
                <div className="sm:col-span-2">
                  <label htmlFor="f-line1" className={labelCls}>Flat / house no., building, street</label>
                  <input id="f-line1" ref={line1Ref} value={f.line1} onChange={set("line1")}
                         autoComplete="address-line1" placeholder="Address"
                         className={cx(input, bad.has("line1") && inputError)} />
                  {bad.has("line1") && <span className="mt-1 block text-[11.5px] text-maroon">{CHECKS[4][2]}</span>}
                </div>
                <Field k="line2" label="Area / landmark (optional)" autoComplete="address-line2" />
                <Field k="state" label="State" autoComplete="address-level1" placeholder="Auto-filled from PIN" />
              </div>
            </div>

            <div className={block}>
              <div className={blockTitle}><i className={stepDot}>3</i>Payment</div>
              {([
                ["RAZORPAY", "Pay online", "UPI · Cards · Net Banking · Wallets"],
                ...(codEnabled
                  ? [["COD", "Cash on Delivery", codFee > 0 ? `+ ${formatINR(codFee)} handling` : "Available on most PIN codes"] as const]
                  : []),
              ] as const).map(([key, title, sub]) => (
                <label key={key} onClick={() => setMethod(key as "RAZORPAY" | "COD")}
                       className={cx(
                         "mb-2 flex cursor-pointer items-start gap-3 rounded border bg-paper p-3.5 transition-all",
                         method === key ? "border-gold ring-1 ring-gold" : "border-line hover:border-gold/60"
                       )}>
                  <input type="radio" name="pay" checked={method === key}
                         onChange={() => setMethod(key as "RAZORPAY" | "COD")}
                         className="mt-0.5 h-[18px] w-[18px] accent-maroon" />
                  <span>
                    <b className="block text-sm">{title}</b>
                    <span className="text-xs text-muted">{sub}</span>
                  </span>
                </label>
              ))}
            </div>

            <PolicyNote />
            {error && <p className="mt-3.5 text-[13.5px] font-semibold text-maroon">{error}</p>}
          </div>

          <aside className="h-fit rounded border border-line-gold bg-paper p-5 lg:sticky lg:top-sticky-top">
            <h2 className="mb-3 text-[19px]">Order Summary</h2>
            {lines.map((l) => (
              <div key={l.variantId} className={summaryRow}>
                <span className="max-w-[64%]">{l.name} × {l.qty}</span>
                <span>{formatINR(l.pricePaise * l.qty)}</span>
              </div>
            ))}
            <div className={cx(summaryRow, "mt-1.5 border-t border-line pt-2.5")}>
              <span>Subtotal</span><span>{formatINR(subtotal)}</span>
            </div>
            <div className={summaryRow}>
              <span>Shipping</span>
              <span className={shipping ? "" : "font-bold text-forest"}>{shipping ? formatINR(shipping) : "FREE"}</span>
            </div>
            {fee > 0 && <div className={summaryRow}><span>COD fee</span><span>{formatINR(fee)}</span></div>}
            <div className={summaryTotal}><span>Total</span><b className="text-maroon">{formatINR(total)}</b></div>

            <button onClick={placeOrder} disabled={busy} className={cx(btn.primary, btnFull, "mt-3.5")}>
              {busy ? "Please wait…" : method === "COD" ? "Place Order" : `Pay ${formatINR(total)}`}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Amount is recalculated on our server before you are charged.
            </p>
          </aside>
        </div>
      </div>

      {/* Sticky pay bar, mobile only. Sits above the tab bar, never under it. */}
      <div className="fixed inset-x-0 bottom-0 z-buybar flex items-center gap-2.5 border-t border-line-gold bg-[#FDF0F1]/97 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
        <div className="flex-none">
          <b className="block text-base text-maroon">{formatINR(total)}</b>
          <span className="text-[10px] text-muted">{shipping ? "incl. shipping" : "free shipping"}</span>
        </div>
        <button onClick={placeOrder} disabled={busy} className={cx(btn.primary, "flex-1")}>
          {busy ? "Please wait…" : method === "COD" ? "Place Order" : "Pay Now"}
        </button>
      </div>
    </>
  );
}
