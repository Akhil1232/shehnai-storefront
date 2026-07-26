import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

/**
 * DESKTOP — four arch-framed image tiles.
 * MOBILE  — a quiet list: small thumb, name, Devanagari, hairline divider.
 *           Four image tiles on a phone is four more banners; a list is how a
 *           printed catalogue would index itself.
 */
export default function CategoryTiles({
  verticals,
  heading,
  sub,
}: {
  verticals: { id: string; slug: string; name: string; devName: string | null; bannerUrl: string | null }[];
  heading: string;
  sub?: string;
}) {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead title={heading} sub={sub} />

        {/* ------------------------------------------------------- mobile -- */}
        <div className="mt-6 sm:hidden">
          {verticals.map((v) => (
            <Link
              key={v.id}
              href={`/collections/${v.slug}`}
              className="flex items-center gap-3.5 border-b border-[color:var(--line-gold)] py-3.5 first:border-t"
            >
              <div className="relative h-11 w-11 flex-none overflow-hidden rounded-[22px_22px_2px_2px] border border-[color:var(--line-gold)]">
                {v.bannerUrl && <Image src={v.bannerUrl} alt="" fill sizes="44px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-[12.5px] font-bold uppercase tracking-[0.13em] text-ink">{v.name}</b>
                {v.devName && <span className="block font-dev text-[12px] text-gold-bright">{v.devName}</span>}
              </div>
              <span className="text-[13px] text-gold">→</span>
            </Link>
          ))}
        </div>

        {/* ------------------------------------------------------ desktop -- */}
        <Reveal className="hidden sm:block">
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-[clamp(14px,2vw,24px)]">
            {verticals.map((v) => (
              <Link
                key={v.id}
                href={`/collections/${v.slug}`}
                className="group relative rounded-md border border-[color:var(--line-gold)] bg-paper px-3.5 pb-5 pt-[22px] text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(122,35,51,.14)]"
              >
                <div className="relative mx-auto aspect-square w-[78%] overflow-hidden rounded-[150px_150px_6px_6px] border border-[color:var(--line-gold)]">
                  {v.bannerUrl && (
                    <Image src={v.bannerUrl} alt={v.name} fill sizes="25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.07]" />
                  )}
                </div>
                <b className="mt-4 block text-[12px] font-bold uppercase tracking-[0.16em] text-ink">{v.name}</b>
                {v.devName && <span className="mt-0.5 block font-dev text-[13px] text-gold-bright">{v.devName}</span>}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
