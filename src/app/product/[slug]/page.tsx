import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { fullProductInclude, cardProductSelect } from "@/types/catalog";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHead from "@/components/ui/SectionHead";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, metaTitle: true, metaDescription: true, images: { take: 1 } },
  });
  if (!p) return {};
  return {
    title: p.metaTitle ?? p.name,
    description: p.metaDescription ?? p.description.slice(0, 155),
    openGraph: { images: p.images[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: fullProductInclude,
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  const related = await prisma.product.findMany({
    where: { status: "PUBLISHED", verticalId: product.verticalId, id: { not: product.id } },
    select: cardProductSelect,
    take: 4,
  });

  const spec: [string, string | null][] = [
    ["Material", product.material],
    ["Dimensions", product.dimensions],
    ["Weight", product.weightGrams ? `${product.weightGrams} g` : null],
    ["Closure", product.closure],
  ];

  return (
    <>
      <div className="wrap grid gap-[clamp(24px,4vw,56px)] py-10 md:grid-cols-2">
        <Gallery images={product.images} name={product.name} />

        <div>
          <span className="eyebrow text-maroon">
            {product.category?.name ?? product.vertical.name}
          </span>
          <h1 className="my-2 text-[clamp(28px,3.6vw,42px)]">{product.name}</h1>
          {product.reviewCount > 0 && (
            <div className="mb-3 text-[12px] tracking-[2px] text-gold">
              {"★".repeat(Math.round(product.ratingAvg))}
              <span className="ml-2 text-[color:var(--muted)]">
                {product.ratingAvg.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
          )}

          <AddToCart product={product} />

          <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--muted)]">
            {product.description}
          </p>

          {spec.some(([, v]) => v) && (
            <dl className="mt-7 border-t border-[color:var(--line)]">
              {spec.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-4 border-b border-[color:var(--line)] py-2.5 text-[13.5px]">
                  <dt className="w-32 flex-none font-bold uppercase tracking-[0.1em] text-[11px] text-ink">{k}</dt>
                  <dd className="text-[color:var(--muted)]">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.careNotes && (
            <div className="mt-6 rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-4 text-[13px] text-[color:var(--muted)]">
              <b className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-ink">Care</b>
              {product.careNotes}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <SectionHead title="You May Also Like" />
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  );
}
