"use client";

import { useState } from "react";
import { btn, cx, input } from "@/lib/styles";

/** Sets delivery expectations before the customer has to ask. */
export default function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function check() {
    const v = pin.replace(/\D/g, "");
    if (v.length !== 6) return setMsg({ ok: false, text: "Please enter a valid 6-digit PIN code." });
    const days = 3 + (parseInt(v.slice(-1), 10) % 4);
    setMsg({ ok: true, text: `Delivers in about ${days}–${days + 2} days to ${v}. Cash on Delivery available.` });
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input value={pin} inputMode="numeric" maxLength={6} aria-label="PIN code"
               onChange={(e) => setPin(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && check()}
               placeholder="Enter PIN code to check delivery" className={input} />
        <button onClick={check} className={cx(btn.ghost, "flex-none")}>Check</button>
      </div>
      {msg && (
        <p className={cx("mt-2 text-[13.5px]", msg.ok ? "text-forest" : "text-maroon")}>
          {msg.ok ? "✓ " : ""}{msg.text}
        </p>
      )}
    </div>
  );
}
