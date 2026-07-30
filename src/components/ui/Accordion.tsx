"use client";

import { useState } from "react";

/** Collapses long copy so the buy box stays within reach. */
export default function Accordion({
  title, children, defaultOpen = false,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
              className="flex w-full items-center justify-between py-4 text-left text-xs font-extrabold uppercase tracking-[0.12em]">
        {title}
        <span className="text-[17px] font-normal text-gold-deep">{open ? "\u2212" : "+"}</span>
      </button>
      {open && <div className="pb-4 text-[13.5px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
