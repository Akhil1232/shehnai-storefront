import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import ProductGrid from "@/components/product/ProductGrid";
import ProductRail from "@/components/product/ProductRail";
import ProductMedia from "@/components/ui/ProductMedia";
import SectionHead from "@/components/ui/SectionHead";
import TrustRow from "@/components/home/TrustRow";
import Newsletter from "@/components/home/Newsletter";
import Reveal from "@/components/ui/Reveal";
import Divider from "@/components/ui/Divider";
import { formatINR, discountPercent } from "@/lib/money";
import { btn, cx, eyebrow, jewelField, linkArrow, section, wrap } from "@/lib/styles";

export const revalidate = 60;

export default async function HomePage() {
  const [verticals, sections, fresh, best, reviews, heroBanner] = await Promise.all([
    prisma.vertical.findMany({
      where: { isActive: true }, orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true } },
        products: { where: { status: "PUBLISHED" }, take: 1,
                    select: { slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      },
    }),
    prisma.homeSection.findMany({
      where: { isActive: true, kind: "EDITORIAL" }, orderBy: { sortOrder: "asc" }, take: 1,
      include: { product: { include: { variants: { take: 1 }, images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
    }),
    prisma.product.findMany({ where: { status: "PUBLISHED", badge: "NEW" }, select: cardProductSelect, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { status: "PUBLISHED", isFeatured: true }, select: cardProductSelect, orderBy: { ratingAvg: "desc" }, take: 8 }),
    prisma.review.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    // HOME_HERO is the current placement. HOME_TRIPTYCH is the legacy name
    // from the old three-panel hero; it is still accepted so banners created
    // before the redesign keep working.
    prisma.banner.findFirst({
      where: { placement: { in: ["HOME_HERO", "HOME_TRIPTYCH"] }, isActive: true },
      orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const editorial = sections[0];
  const eVariant = editorial?.product?.variants[0];

  return (
    <>
      {/* HERO — one message, one primary action. */}
      <section className="border-b border-line-gold">
        <div className={cx(wrap, "grid items-center gap-7 pb-10 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-13 lg:pb-16 lg:pt-14")}>
          <div className="text-center lg:text-left">
            <span className="font-dev text-[19px] text-maroon">शहनाई</span>
            <h1 className="my-3 text-display">The first note of<br />every celebration</h1>
            <p className="mx-auto mb-6 max-w-[46ch] text-[15px] text-muted lg:mx-0">
              Kundan and brass, worked the way they always have been — for men, for women,
              for weddings, and for the mandir at home.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 lg:justify-start">
              <Link href="/collections/all" className={btn.primary}>Shop All Jewellery</Link>
              <Link href="/collections/wedding" className={btn.line}>The Wedding Edit</Link>
            </div>

          </div>

          <div className="mx-auto w-full max-w-[320px] lg:max-w-none">
            <Link href={heroBanner?.href ?? "/collections/all"}
                  className={cx(jewelField, "block aspect-[4/4.7] rounded-arch shadow-frame")}>
              <ProductMedia url={heroBanner?.desktopUrl} alt={heroBanner?.alt || "Shehnai jewellery"}
                            seed="hero-frame" category="necklace" priority
                            sizes="(max-width:900px) 320px, 46vw" />
            </Link>
          </div>
        </div>
      </section>

      {/* SHOP BY COLLECTION — the same component at every width. */}
      <section className={section}>
        <div className={wrap}>
          <SectionHead center rule eyebrow="Shop by collection" title="Four houses, one bench"
                       sub="Every piece is made and finished by the same hands." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {verticals.map((v) => (
              <Link key={v.id} href={`/collections/${v.slug}`}
                    className="group block rounded border border-line bg-paper px-3 pb-4 pt-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-card">
                <div className={cx(jewelField, "mx-auto mb-3 aspect-square w-[76%] rounded-arch border border-line-gold")}>
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.07]">
                    <ProductMedia url={v.bannerUrl ?? v.products[0]?.images[0]?.url} alt={v.name}
                                  seed={v.slug} category={v.slug} sizes="(max-width:760px) 40vw, 20vw" />
                  </div>
                </div>
                <h3 className="text-base md:text-[19px]">{v.name}</h3>
                {v.devName && <span className="block font-dev text-xs text-maroon">{v.devName}</span>}
                <span className="text-[11px] text-muted">{v._count.products} pieces</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {fresh.length > 0 && (
        <section className={cx(section, "pt-0")}>
          <div className={wrap}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <SectionHead eyebrow="Just in" title="New Arrivals" />
              <Link href="/collections/all?sort=newest" className={cx(linkArrow, "mb-5 flex-none")}>View all →</Link>
            </div>
            <ProductRail products={fresh} />
          </div>
        </section>
      )}

      {editorial && (
        <section className={cx(section, "border-y border-line-gold bg-cream/55")}>
          <div className={cx(wrap, "grid items-center gap-6 lg:grid-cols-2 lg:gap-13")}>
            <Reveal className="mx-auto w-full max-w-[340px] lg:max-w-none">
              <div className={cx(jewelField, "aspect-[4/4.6] rounded border border-line-gold")}>
                <ProductMedia url={editorial.mediaUrl ?? editorial.product?.images[0]?.url}
                              alt={editorial.heading ?? "Featured piece"} seed={editorial.key}
                              category="brooch" sizes="(max-width:900px) 340px, 46vw" />
              </div>
            </Reveal>

            <div className="text-center lg:text-left">
              {editorial.eyebrow && <span className={eyebrow}>{editorial.eyebrow}</span>}
              <h2 className="my-3 text-h1">{editorial.heading}</h2>
              {editorial.body && (
                <p className="mx-auto mb-4 max-w-[44ch] text-sm text-muted lg:mx-0">{editorial.body}</p>
              )}
              {eVariant && (
                <div className="mb-5 flex flex-wrap items-baseline justify-center gap-3 lg:justify-start">
                  <span className="text-[23px] font-extrabold text-gold-deep">{formatINR(eVariant.pricePaise)}</span>
                  {eVariant.mrpPaise > eVariant.pricePaise && (
                    <>
                      <span className="text-muted line-through">{formatINR(eVariant.mrpPaise)}</span>
                      <span className="text-[13.5px] font-extrabold text-forest">
                        {discountPercent(eVariant.pricePaise, eVariant.mrpPaise)}% off
                      </span>
                    </>
                  )}
                </div>
              )}
              <Link href={editorial.ctaHref ?? (editorial.product ? `/product/${editorial.product.slug}` : "/collections/all")}
                    className={btn.gold}>
                {editorial.ctaLabel ?? "View the Piece"}
              </Link>
            </div>
          </div>
        </section>
      )}

      {best.length > 0 && (
        <section className={section}>
          <div className={wrap}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <SectionHead eyebrow="Most loved" title="Bestsellers" />
              <Link href="/collections/all" className={cx(linkArrow, "mb-5 flex-none")}>View all →</Link>
            </div>
            <ProductGrid products={best} />
          </div>
        </section>
      )}

      <Divider />

      <section className="py-7"><div className={wrap}><TrustRow /></div></section>

      {reviews.length > 0 && (
        <section className={section}>
          <div className={wrap}>
            <SectionHead center rule eyebrow="Reviews" title="In Their Words" />
            <div className="no-bar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1.5">
              {reviews.map((r, i) => (
                <div key={r.id}
                     className="w-[min(300px,80vw)] flex-none snap-start rounded border border-line-gold bg-paper p-5">
                  <div className="mb-2.5 flex items-center gap-3">
                    <span className={cx("grid h-10 w-10 flex-none place-items-center rounded-full font-serif text-base font-semibold text-white",
                                        i % 2 ? "bg-forest" : "bg-maroon")}>
                      {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      <b className="block text-[13.5px]">{r.name}</b>
                      <span className="text-[11.5px] text-muted">{r.city}</span>
                    </span>
                  </div>
                  <div className="text-[11px] tracking-[2px] text-gold">{"★".repeat(r.rating)}</div>
                  {r.title && <p className="mb-1 mt-1.5 text-sm font-bold">{r.title}</p>}
                  <p className="text-[13.5px] text-muted">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  );
}
