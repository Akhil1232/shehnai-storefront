import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

/** Category banner spec: 1920 x 640 (3:1). Cropped to a square-ish arch here. */
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
        <Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-[clamp(14px,2vw,24px)]">
            {verticals.map((v) => (
              <Link
                key={v.id}
                href={`/collections/${v.slug}`}
                className="group relative rounded-md border border-[color:var(--line-gold)] bg-paper px-3.5 pb-5 pt-[22px] text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(122,35,51,.14)]"
              >
                <div className="relative mx-auto aspect-square w-[78%] overflow-hidden rounded-[150px_150px_6px_6px] border border-[color:var(--line-gold)]">
                  {v.bannerUrl && (
                    <Image
                      src={v.bannerUrl}
                      alt={v.name}
                      fill
                      sizes="25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                    />
                  )}
                </div>
                <b className="mt-4 block text-[12px] font-bold uppercase tracking-[0.16em] text-ink">
                  {v.name}
                </b>
                {v.devName && (
                  <span className="mt-0.5 block font-dev text-[13px] text-gold-bright">{v.devName}</span>
                )}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
