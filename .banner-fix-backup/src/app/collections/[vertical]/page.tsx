import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Rule from "@/components/ui/Rule";
import { FilterSidebar, FilterBar, FilterChips, SortToolbar, PRICE_BANDS } from "@/components/collection/Filters";
import { cx, wrap } from "@/lib/styles";

export const revalidate = 60;

type Search = { category?: string | string[]; price?: string | string[]; sort?: string };

const ORDER: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  featured: { sortOrder: "asc" },
  newest: { createdAt: "desc" },
  rating: { ratingAvg: "desc" },
};

const arr = (v?: string | string[]) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  if (vertical === "all") return { title: "All Jewellery" };
  const v = await prisma.vertical.findUnique({ where: { slug: vertical } });
  return v ? { title: v.name, description: v.description ?? undefined } : {};
}

export default async function CollectionPage({
  params, searchParams,
}: { params: Promise<{ vertical: string }>; searchParams: Promise<Search> }) {
  const { vertical: slug } = await params;
  const sp = await searchParams;
  const isAll = slug === "all";

  const vertical = isAll ? null : await prisma.vertical.findUnique({
    where: { slug },
    include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!isAll && !vertical) notFound();

  const cats = arr(sp.category);
  const bands = arr(sp.price);

  const priceOr: Prisma.ProductVariantWhereInput[] = bands.map((b) => {
    const [lo, hi] = b.split("-");
    return { pricePaise: { gte: Number(lo) * 100, ...(hi ? { lte: Number(hi) * 100 } : {}) } };
  });

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(vertical ? { verticalId: vertical.id } : {}),
    ...(cats.length ? { category: { slug: { in: cats } } } : {}),
    ...(priceOr.length ? { variants: { some: { OR: priceOr } } } : {}),
  };

  const sortKey = sp.sort ?? "featured";

  const [products, catCounts] = await Promise.all([
    prisma.product.findMany({ where, select: cardProductSelect, orderBy: ORDER[sortKey] ?? ORDER.featured, take: 120 }),
    vertical
      ? prisma.product.groupBy({
          by: ["categoryId"],
          where: { status: "PUBLISHED", verticalId: vertical.id },
          _count: { _all: true },
        })
      : Promise.resolve([] as { categoryId: string | null; _count: { _all: number } }[]),
  ]);

  // Prisma cannot order by a field across a to-many relation, so price sorting
  // happens here instead.
  if (sortKey === "low" || sortKey === "high") {
    products.sort((a, b) => {
      const pa = a.variants[0]?.pricePaise ?? 0;
      const pb = b.variants[0]?.pricePaise ?? 0;
      return sortKey === "low" ? pa - pb : pb - pa;
    });
  }

  const categories = (vertical?.categories ?? []).map((c) => ({
    slug: c.slug, name: c.name,
    count: catCounts.find((x) => x.categoryId === c.id)?._count._all ?? 0,
  }));

  const chips = [
    ...cats.map((c) => ({ key: "category" as const, value: c,
      label: categories.find((x) => x.slug === c)?.name ?? c.replace(/-/g, " ") })),
    ...bands.map((b) => ({ key: "price" as const, value: b,
      label: PRICE_BANDS.find((p) => p[0] === b)?.[1] ?? b })),
  ];

  const title = vertical?.name ?? "All Jewellery";

  return (
    <div className={wrap}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />

      <div className="border-b border-line pb-4">
        <h1 className="text-h1">{title}</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          {vertical?.description ?? "Every piece across all four collections."}
        </p>
        <Rule className="mx-0 mt-3" />
      </div>

      <Suspense fallback={null}>
        <FilterBar categories={categories} />
        <FilterChips labels={chips} />
      </Suspense>

      <div className={cx("grid items-start gap-6 py-5 pb-12 lg:grid-cols-[236px_1fr] lg:gap-9")}>
        <Suspense fallback={<div />}>
          <FilterSidebar categories={categories} />
        </Suspense>
        <div>
          <Suspense fallback={null}><SortToolbar count={products.length} /></Suspense>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
