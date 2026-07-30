import { cx } from "@/lib/styles";

/** Gold hairline with a diamond centre — the house divider. */
export default function Rule({ className }: { className?: string }) {
  return (
    <div className={cx("relative mx-auto mt-3 h-[1.5px] w-11 bg-gold", className)}>
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold bg-beige" />
    </div>
  );
}
