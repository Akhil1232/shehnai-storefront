"use client";

import { useToast } from "@/store/toast";
import { cx } from "@/lib/styles";
import { Icon } from "./icons";

/** Sits above the mobile tab bar so it never covers navigation. */
export default function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "pointer-events-none fixed left-1/2 z-toast flex max-w-[calc(100vw-2rem)] items-center gap-2",
        "rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-cream shadow-lift",
        "bottom-[calc(theme(spacing.tabbar)+1rem)] lg:bottom-6",
        "transition-all duration-300 ease-silk",
        message ? "-translate-x-1/2 translate-y-0 opacity-100" : "-translate-x-1/2 translate-y-5 opacity-0"
      )}
    >
      {message && (<><Icon name="check" className="h-4 w-4 shrink-0 text-gold" /><span>{message}</span></>)}
    </div>
  );
}
