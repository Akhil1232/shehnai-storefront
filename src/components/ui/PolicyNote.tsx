import Link from "next/link";
import { linkArrow } from "@/lib/styles";

/**
 * Shipping + replacement terms, shown wherever someone is about to commit.
 * Stating the video requirement BEFORE payment prevents the argument after
 * delivery.
 */
export default function PolicyNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11.5px] leading-relaxed text-muted">
        Dispatch in 2&ndash;3 working days. Replacement only, for damaged, wrong or missing items &mdash;{" "}
        <Link href="/policies/returns" className="font-bold text-maroon underline underline-offset-2">
          an unboxing video is required
        </Link>. No returns or refunds.
      </p>
    );
  }

  const items = [
    <>Dispatched within <b className="font-semibold text-ink">2&ndash;3 working days</b>.</>,
    <><b className="font-semibold text-ink">Replacement only</b> &mdash; for items that arrive damaged, incorrect or missing. No returns or refunds.</>,
    <>A continuous, unedited <b className="font-semibold text-ink">unboxing video</b> is required for any claim. Please start recording before opening the parcel.</>,
  ];

  return (
    <div className="rounded border border-line-gold bg-cream p-3.5">
      <b className="mb-2 block text-[10.5px] font-extrabold uppercase tracking-[0.13em]">
        Shipping &amp; replacements
      </b>
      <ul className="space-y-1.5">
        {items.map((node, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-muted">
            <span className="font-extrabold text-gold">&middot;</span>
            <span>{node}</span>
          </li>
        ))}
      </ul>
      <Link href="/policies/returns" className={`${linkArrow} mt-2`}>Read the full policy &rarr;</Link>
    </div>
  );
}
