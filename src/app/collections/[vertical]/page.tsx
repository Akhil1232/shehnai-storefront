import { notFound } from "next/navigation";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import ProductGrid from "@/components/product/ProductGrid";
import Filters from "@/components/collection/Filters";
import Rule from "@/components/ui/Rule";

export const revalidate = 60;

type Search = { category?: string; sort?: string; min?: string; max?: string };

const ORDER: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  rating: { ratingAvg: "desc" },
  featured: { sortOrder: "asc" },
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<Search>;
}) {
  const { vertical: slug } = await params;
  const sp = await searchParams;
  const isAll = slug === "all";

  const vertical = isAll
    ? null
    : await prisma.vertical.findUnique({
        where: { slug },
        include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      });

  if (!isAll && !vertical) notFound();

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(vertical ? { verticalId: vertical.id } : {}),
    ...(sp.category ? { category: { slug: sp.category } } : {}),
    ...(sp.min || sp.max
      ? {
          variants: {
            some: {
              pricePaise: {
                ...(sp.min ? { gte: Number(sp.min) * 100 } : {}),
                ...(sp.max ? { lte: Number(sp.max) * 100 } : {}),
              },
            },
          },
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    select: cardProductSelect,
    orderBy: ORDER[sp.sort ?? "featured"] ?? ORDER.featured,
    take: 96, // paginate past this once the catalogue grows beyond ~400
  });

  const title = vertical?.name ?? "All Jewellery";
  const banner = vertical?.bannerUrl;

  return (
    <>
      <header className="relative border-b border-[color:var(--line)] pb-5 pt-8 text-center sm:pt-[clamp(28px,4vw,48px)]">
        {/* The banner is desktop-only. On a phone the title alone is calmer,
            and it was the main source of "too many banners". */}
        {banner && (
          <div className="relative mx-auto mb-6 hidden aspect-[3/1] max-w-[1280px] overflow-hidden rounded-[2px] sm:block">
            <Image src={banner} alt={title} fill priority sizes="100vw" className="object-cover" />
          </div>
        )}
        <div className="wrap">
          <span className="eyebrow text-maroon">Collection</span>
          <h1 className="my-2 text-[27px] sm:text-[clamp(30px,4.2vw,48px)]">{title}</h1>
          {vertical?.description && (
            <p className="mx-auto max-w-[52ch] text-[13px] text-[color:var(--muted)] sm:text-[14.5px]">
              {vertical.description}
            </p>
          )}
          <Rule className="mt-4" />
        </div>
      </header>

      <div className="wrap grid items-start gap-[clamp(24px,3vw,44px)] py-10 md:grid-cols-[240px_1fr]">
        <Filters
          categories={vertical?.categories ?? []}
          basePath={`/collections/${slug}`}
          active={sp}
        />
        <div>
          <p className="pb-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)]">
            {products.length} piece{products.length === 1 ? "" : "s"}
          </p>
          <ProductGrid products={products} />
        </div>
      </div>
    </>
  );
}
