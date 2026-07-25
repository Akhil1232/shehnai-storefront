import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import HeroTriptych from "@/components/home/HeroTriptych";
import EditorialSection, { type EditorialData } from "@/components/home/EditorialSection";
import CategoryTiles from "@/components/home/CategoryTiles";
import TrustStrip from "@/components/home/TrustStrip";
import ReviewRow from "@/components/home/ReviewRow";
import Newsletter from "@/components/home/Newsletter";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHead from "@/components/ui/SectionHead";
import Link from "next/link";

// Rebuild the home page at most once a minute; admin edits appear without a deploy.
export const revalidate = 60;

export default async function HomePage() {
  const [triptych, sections, verticals, newArrivals, bestsellers, reviews] =
    await Promise.all([
      prisma.banner.findMany({
        where: { placement: "HOME_TRIPTYCH", isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
      prisma.homeSection.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { product: { include: { variants: { take: 1 } } } },
      }),
      prisma.vertical.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED", badge: "NEW" },
        select: cardProductSelect,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        select: cardProductSelect,
        orderBy: { ratingAvg: "desc" },
        take: 8,
      }),
      prisma.review.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const editorials = sections.filter((s) => s.kind === "EDITORIAL") as EditorialData[];

  return (
    <>
      <HeroTriptych
        panels={triptych.map((b) => ({
          id: b.id,
          title: b.title,
          desktopUrl: b.desktopUrl,
          alt: b.alt,
          href: b.href,
        }))}
        heading="The First Note of Every Celebration"
        sub="Kundan and brass, worked the way they always have been — for the men, the women, and the quiet devotion of a home shrine."
      />

      {editorials[0] && <EditorialSection data={editorials[0]} />}

      <CategoryTiles
        verticals={verticals}
        heading="Explore the House"
        sub="Four collections, one house — Men's, Women's, Murti Sringaar and Wedding."
      />

      {editorials[1] && <EditorialSection data={editorials[1]} />}

      {newArrivals.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <SectionHead title="New Arrivals" sub="Fresh off the bench, across every collection." align="left" />
              <Link href="/collections/all?sort=newest" className="btn btn-line">View All</Link>
            </div>
            <ProductGrid products={newArrivals} />
          </div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <SectionHead title="Bestsellers" sub="The pieces our customers keep coming back for." align="left" />
              <Link href="/collections/all" className="btn btn-line">View All</Link>
            </div>
            <ProductGrid products={bestsellers} />
          </div>
        </section>
      )}

      <ReviewRow reviews={reviews} />
      <TrustStrip />
      <Newsletter />
    </>
  );
}
