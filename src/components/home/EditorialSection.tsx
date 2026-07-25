import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { formatINR } from "@/lib/money";
import type { HomeSection, Product, ProductVariant } from "@prisma/client";

type Swatch = { label: string; hex: string };

export type EditorialData = HomeSection & {
  product: (Product & { variants: ProductVariant[] }) | null;
};

/**
 * "The Flagship Piece" / "The Bridal Edit". Every word, the image, the linked
 * product and the left/right flip come from the HomeSection row — editing this
 * block is an admin task, not a code change.
 * Image spec: main 1200x1500 (4:5), minis 800x800.
 */
export default function EditorialSection({ data }: { data: EditorialData }) {
  const swatches = ((data.config as { swatches?: Swatch[] } | null)?.swatches ?? []) as Swatch[];
  const variant = data.product?.variants?.[0];

  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <div
            className={`grid items-center gap-[clamp(26px,4vw,64px)] md:grid-cols-2 ${
              data.reversed ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              {data.mediaUrl && (
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] border border-[color:var(--line-gold)]">
                  <Image
                    src={data.mediaUrl}
                    alt={data.heading ?? ""}
                    fill
                    sizes="(max-width:880px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
              {data.miniUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {data.miniUrls.slice(0, 2).map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-[2px] border border-[color:var(--line-gold)]"
                    >
                      <Image src={url} alt="" fill sizes="25vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              {data.eyebrow && <span className="eyebrow">{data.eyebrow}</span>}
              <b className="my-3 block font-serif text-[clamp(28px,3.6vw,46px)] font-semibold">
                {data.heading}
              </b>
              {data.body && (
                <p className="mb-5 max-w-[44ch] text-[15px] text-[color:var(--muted)]">{data.body}</p>
              )}

              {swatches.length > 0 && (
                <div className="mb-[22px] flex gap-2.5">
                  {swatches.map((s) => (
                    <span
                      key={s.label}
                      className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--muted)]"
                    >
                      <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.hex }} />
                      {s.label}
                    </span>
                  ))}
                </div>
              )}

              {variant && (
                <div className="mb-[26px] flex items-baseline gap-3">
                  <b className="text-[23px] text-gold-bright">{formatINR(variant.pricePaise)}</b>
                  {variant.mrpPaise > variant.pricePaise && (
                    <s className="text-[color:var(--muted)]">{formatINR(variant.mrpPaise)}</s>
                  )}
                </div>
              )}

              {data.ctaLabel && (
                <Link
                  href={data.ctaHref ?? (data.product ? `/product/${data.product.slug}` : "/collections/all")}
                  className="btn btn-gold"
                >
                  {data.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
