"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.includes("@")) return setMsg("Please enter a valid email.");
    setBusy(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setMsg(res.ok ? "You're on the list — welcome to the family." : "Something went wrong.");
    if (res.ok) setEmail("");
  }

  return (
    <section className="section text-center">
      <div className="wrap">
        <div className="mb-2.5 font-dev text-gold-bright">शहनाई</div>
        <h2 className="mb-2 text-[23px] sm:text-[clamp(24px,3vw,34px)]">Join the Shehnai Family</h2>
        <p className="mb-6 text-[14px] text-[color:var(--muted)]">
          Be the first to know about new collections and exclusive offers.
        </p>
        <div className="mx-auto flex max-w-[420px] flex-col gap-2 sm:flex-row sm:gap-0">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your email address"
            aria-label="Email address"
            className="flex-1 rounded-[2px] border border-[color:var(--line)] bg-paper px-[18px] py-3.5 text-center text-[13px] text-ink sm:rounded-l-[2px] sm:rounded-r-none sm:border-r-0 sm:text-left"
          />
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-[2px] bg-gold px-[26px] py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-onyx hover:bg-gold-bright disabled:opacity-60 sm:rounded-l-none sm:rounded-r-[2px] sm:py-0"
          >
            {busy ? "…" : "Subscribe"}
          </button>
        </div>
        {msg && <p className="mt-3 text-[13px] text-[color:var(--muted)]">{msg}</p>}
      </div>
    </section>
  );
}
