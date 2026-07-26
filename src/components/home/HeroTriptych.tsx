import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import Rule from "@/components/ui/Rule";

export type TriptychPanel = {
  id: string;
  title: string | null;
  desktopUrl: string | null;
  mobileUrl?: string | null;
  alt: string;
  href: string | null;
};

/**
 * Two deliberately different layouts.
 *
 * DESKTOP — the three-panel triptych, imagery first, copy beneath.
 * MOBILE  — copy first, then ONE image. Three stacked banners on a phone reads
 *           as a slideshow of ads; a single arch reads as a magazine opening.
 *           The other two panels are still reachable from the collection list
 *           below, so nothing is lost.
 *
 * Image spec: 900 × 1200 (3:4). Top ~30% is masked by the arch — keep it empty.
 * Order comes from Banner.sortOrder: 0 = left, 1 = CENTRE, 2 = right.
 */
export default function HeroTriptych({
  panels,
  heading,
  sub,
}: {
  panels: TriptychPanel[];
  heading: string;
  sub: string;
}) {
  const hero = panels[1] ?? panels[0];

  return (
    <section className="relative">
      {/* ---------------------------------------------------------- mobile -- */}
      <div className="wrap pb-9 pt-8 text-center sm:hidden">
        <span className="mb-3 block font-dev text-[17px] tracking-wide text-maroon">शहनाई</span>
        <h1 className="mx-auto mb-4 max-w-[15ch] text-[30px] leading-[1.16]">{heading}</h1>
        <Rule className="mb-7" />

        {hero?.desktopUrl && (
          <Reveal>
            <Link href={hero.href ?? "/collections/all"} className="mx-auto block max-w-[248px]">
              <div className="arch-frame aspect-[4/5.3]">
                <Image
                  src={hero.mobileUrl || hero.desktopUrl}
                  alt={hero.alt}
                  fill
                  priority
                  sizes="248px"
                  className="object-cover"
                />
              </div>
              {hero.title && (
                <span className="mt-3.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-maroon">
                  {hero.title}
                </span>
              )}
            </Link>
          </Reveal>
        )}

        <p className="mx-auto mt-7 max-w-[34ch] text-[13.5px] leading-relaxed text-[color:var(--muted)]">
          {sub}
        </p>
        <Link href="/collections/all" className="btn btn-line mt-6 w-full max-w-[260px]">
          Explore the Collection
        </Link>
      </div>

      {/* --------------------------------------------------------- desktop -- */}
      <div className="hidden pb-[clamp(24px,3.4vw,42px)] pt-[clamp(22px,3.2vw,36px)] text-center sm:block">
        <div className="mx-auto max-w-[1220px] px-[clamp(18px,4vw,48px)]">
          <Reveal>
            <div className="mx-auto grid max-w-[1120px] items-center gap-[clamp(16px,3vw,32px)] sm:grid-cols-[0.82fr_1.22fr_0.82fr]">
              {panels.map((p, i) => (
                <Link key={p.id} href={p.href ?? "/collections/all"} className="group">
                  <div className="arch-frame aspect-[4/5.3]">
                    {p.desktopUrl && (
                      <Image
                        src={p.desktopUrl}
                        alt={p.alt}
                        fill
                        priority={i === 1}
                        sizes="33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                      />
                    )}
                  </div>
                  {p.title && (
                    <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-maroon">
                      {p.title}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </Reveal>

          <div className="pb-[clamp(28px,4vw,44px)] pt-[clamp(16px,2.4vw,26px)]">
            <span className="mb-4 block font-dev text-[21px] text-maroon">शहनाई</span>
            <h1 className="mx-auto mb-[18px] max-w-[17ch] text-[clamp(34px,5vw,58px)]">{heading}</h1>
            <p className="mx-auto mb-5 max-w-[50ch] text-[15px] text-[color:var(--muted)]">{sub}</p>
            <Rule className="mb-[22px]" />
            <Link href="/collections/all" className="btn btn-line">Explore the Collection</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
