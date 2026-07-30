"use client";

import { useState } from "react";
import { useToast } from "@/store/toast";
import { btn, cx, section, wrap } from "@/lib/styles";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast((s) => s.show);

  async function submit() {
    if (!email.includes("@")) return toast("Please enter a valid email");
    setBusy(true);
    const res = await fetch("/api/newsletter", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.ok) { setEmail(""); toast("Thanks — you're on the list"); }
    else toast("Something went wrong");
  }

  return (
    <section className={cx(section, "text-center")}>
      <div className={wrap}>
        <span className="font-dev text-[17px] text-maroon">शहनाई</span>
        <h2 className="my-1.5 text-h2">Join the Shehnai family</h2>
        <p className="text-[13.5px] text-muted">First look at new collections, and the occasional quiet offer.</p>

        <div className="mx-auto mt-4 flex max-w-[420px] flex-col gap-2 sm:flex-row sm:gap-0">
          <input
            type="email" value={email} aria-label="Email address"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your email address"
            className="h-[50px] flex-1 rounded border border-line bg-paper px-4 text-center text-[13.5px] outline-none focus:border-gold sm:rounded-r-none sm:border-r-0 sm:text-left"
          />
          <button onClick={submit} disabled={busy} className={cx(btn.gold, "sm:rounded-l-none")}>
            {busy ? "…" : "Subscribe"}
          </button>
        </div>
      </div>
    </section>
  );
}
