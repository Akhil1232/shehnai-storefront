"use client";

import { cx } from "@/lib/styles";

/** One quantity control, used by the cart, the drawer and the PDP. */
export default function QtyStepper({
  qty, onChange, small = false, max = 10, className,
}: {
  qty: number; onChange: (q: number) => void;
  small?: boolean; max?: number; className?: string;
}) {
  const box = small ? "h-8 w-8 text-[15px]" : "h-[46px] w-[42px] text-lg";
  return (
    <div className={cx("inline-flex items-center overflow-hidden rounded border border-line bg-paper", className)}>
      <button onClick={() => onChange(Math.max(1, qty - 1))} aria-label="Decrease"
              className={cx(box, "transition-colors hover:bg-cream")}>&minus;</button>
      <span className={cx("text-center font-bold", small ? "w-7 text-[13px]" : "w-9 text-[14.5px]")}>{qty}</span>
      <button onClick={() => onChange(Math.min(max, qty + 1))} aria-label="Increase"
              className={cx(box, "transition-colors hover:bg-cream")}>+</button>
    </div>
  );
}
