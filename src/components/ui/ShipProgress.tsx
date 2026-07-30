import { formatINR } from "@/lib/money";

/** Shows exactly how far off free shipping is. */
export default function ShipProgress({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const away = threshold - subtotal;
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="my-3">
      <div className="h-[5px] overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep transition-[width] duration-500 ease-silk"
             style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-center text-[11.5px] text-muted">
        {away > 0 ? <>Add <b className="text-ink">{formatINR(away)}</b> more for free shipping</>
                  : "\u2713 You have unlocked free shipping"}
      </p>
    </div>
  );
}
