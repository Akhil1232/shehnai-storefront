"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icons";

export default function AnnounceBar({ text }: { text: string }) {
  const [shown, setShown] = useState(true);
  if (!text || !shown) return null;
  return (
    <div className="relative border-b border-line-gold bg-maroon px-10 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[#F3E3C8]">
      <span className="line-clamp-1">{text}</span>
      <button onClick={() => setShown(false)} aria-label="Dismiss announcement"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-65 hover:opacity-100">
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
