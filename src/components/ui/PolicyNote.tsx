import Link from "next/link";

/**
 * The shipping + replacement disclaimer, shown wherever someone is about to
 * commit: product page, cart, checkout. Stating the video requirement BEFORE
 * payment is what prevents the argument after delivery.
 */
export default function PolicyNote({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <p className="text-[11.5px] leading-relaxed text-[color:var(--muted)]">
        Dispatch in 2–3 working days. Replacement only, for damaged, wrong or missing
        items — a continuous{" "}
        <Link href="/policies/returns" className="font-semibold text-maroon underline underline-offset-2">
          unboxing video is required
        </Link>
        . No returns or refunds.
      </p>
    );
  }

  return (
    <div className="rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-4">
      <b className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink">
        Shipping &amp; replacements
      </b>
      <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-[color:var(--muted)]">
        <li className="flex gap-2">
          <span className="text-gold">·</span>
          Dispatched within <b className="font-semibold text-ink">2–3 working days</b>.
        </li>
        <li className="flex gap-2">
          <span className="text-gold">·</span>
          <span>
            <b className="font-semibold text-ink">Replacement only</b> — for items that arrive
            damaged, incorrect or missing. We do not offer returns or refunds.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-gold">·</span>
          <span>
            A continuous, unedited <b className="font-semibold text-ink">unboxing video</b> is
            required for any claim. Please start recording before opening the parcel.
          </span>
        </li>
      </ul>
      <Link
        href="/policies/returns"
        className="mt-2.5 inline-block text-[11.5px] font-bold uppercase tracking-[0.1em] text-maroon"
      >
        Read the full policy →
      </Link>
    </div>
  );
}
