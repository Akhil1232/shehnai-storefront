import { cx } from "@/lib/styles";

/**
 * Decorative jaali band used between sections.
 *
 * This is where the house pattern lives now. It used to tile across the whole
 * page, which put lattice directly behind every paragraph and made the type
 * hard to read. Confining it to dividers keeps the texture without ever
 * competing with text.
 *
 * The mask fades both ends so the repeat never looks cut off.
 */
export default function Divider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("flex items-center justify-center py-2", className)}>
      <span
        className="h-7 w-full max-w-[420px] bg-band bg-[length:120px_28px] bg-center bg-repeat-x opacity-70"
        style={{
          maskImage: "linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)",
          WebkitMaskImage: "linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)",
        }}
      />
    </div>
  );
}
