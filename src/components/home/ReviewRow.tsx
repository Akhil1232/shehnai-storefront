import SectionHead from "@/components/ui/SectionHead";
import Reveal from "@/components/ui/Reveal";
import type { Review } from "@prisma/client";

const initials = (n: string) =>
  n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function ReviewRow({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead title="Real People, Real Reviews" />
        <Reveal>
          <div className="flex snap-x snap-mandatory gap-[18px] overflow-x-auto px-1 pb-2.5 pt-6">
            {reviews.map((r, i) => (
              <div
                key={r.id}
                className="w-[min(300px,80vw)] flex-none snap-start rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-[22px]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`grid h-[42px] w-[42px] flex-none place-items-center rounded-full font-serif text-base font-semibold text-white ${
                      i % 2 ? "bg-emerald" : "bg-maroon"
                    }`}
                  >
                    {initials(r.name)}
                  </div>
                  <div>
                    <b className="block text-[13.5px] text-ink">{r.name}</b>
                    <span className="text-[11.5px] text-[color:var(--muted)]">{r.city}</span>
                  </div>
                </div>
                <div className="text-[11px] tracking-[2px] text-gold">{"★".repeat(r.rating)}</div>
                {r.title && <p className="mt-2 text-[13.5px] font-semibold text-ink">{r.title}</p>}
                <p className="mt-1 text-[13.5px] italic text-[color:var(--muted)]">{r.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
