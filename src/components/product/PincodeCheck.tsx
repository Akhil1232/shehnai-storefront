"use client";

import { useState } from "react";
import { btn, cx, input } from "@/lib/styles";

/** Sets delivery expectations before the customer has to ask. Backed by Delhivery's live serviceability check. */
export default function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function check() {
    const v = pin.replace(/\D/g, "");
    if (v.length !== 6) {
      setMsg({ ok: false, text: "Please enter a valid 6-digit PIN code." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/delhivery/pincode?pincode=${v}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Could not check delivery availability right now." });
        return;
      }
      if (!data.serviceable) {
        setMsg({ ok: false, text: `Sorry, we don't currently deliver to ${v}.` });
        return;
      }
      const where = [data.city, data.state].filter(Boolean).join(", ");
      const cod = data.codAvailable ? "Cash on Delivery available." : "Prepaid orders only for this PIN code.";
      setMsg({ ok: true, text: `Delivers to ${where || v}. ${cod}` });
    } catch {
      setMsg({ ok: false, text: "Could not check delivery availability right now." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input value={pin} inputMode="numeric" maxLength={6} aria-label="PIN code"
               onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
               onKeyDown={(e) => e.key === "Enter" && check()}
               placeholder="Enter PIN code to check delivery" className={input} />
        <button onClick={check} disabled={loading} className={cx(btn.ghost, "flex-none")}>
          {loading ? "Checking…" : "Check"}
        </button>
      </div>
      {msg && (
        <p className={cx("mt-2 text-[13.5px]", msg.ok ? "text-forest" : "text-maroon")}>
          {msg.ok ? "✓ " : ""}{msg.text}
        </p>
      )}
    </div>
  );
}
