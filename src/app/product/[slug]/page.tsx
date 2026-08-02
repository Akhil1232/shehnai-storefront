import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { fullProductInclude, cardProductSelect } from "@/types/catalog";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import PincodeCheck from "@/components/product/PincodeCheck";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SectionHead from "@/components/ui/SectionHead";
import Accordion from "@/components/ui/Accordion";
import PolicyNote from "@/components/ui/PolicyNote";
import { Icon, type IconName } from "@/components/ui/icons";
import { cx, eyebrow, section, wrap } from "@/lib/styles";

export const revalidate = 60;

const stars = (r: number) => "\u2605".repeat(Math.round(r)) + "\u2606".repeat(5 - Math.round(r));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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
  const product = await prisma.product.findUnique({ where: { slug }, include: fullProductInclude });
  if (!product || product.status !== "PUBLISHED") notFound();

  const related = await prisma.product.findMany({
    where: { status: "PUBLISHED", verticalId: product.verticalId, id: { not: product.id } },
    select: cardProductSelect, take: 4,
  });

  const spec: [string, string | null][] = [
    ["Material", product.material],
    ["Dimensions", product.dimensions],
    ["Weight", product.weightGrams ? `${product.weightGrams} g` : null],
    ["Closure", product.closure],
  ];

  const usp: [IconName, string][] = [
    ["truck", "Dispatch in 2–3 days"],
    ["swap", "Replacement support"],
    ["cash", "Secure payments"],
  ];

  return (
    <div className={wrap}>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: product.vertical.name, href: `/collections/${product.vertical.slug}` },
        ...(product.category
          ? [{ label: product.category.name, href: `/collections/${product.vertical.slug}?category=${product.category.slug}` }]
          : []),
        { label: product.name },
      ]} />

      <div className="grid gap-6 pb-10 lg:grid-cols-[1.06fr_.94fr] lg:gap-12 lg:pb-15">
        <Gallery images={product.images} name={product.name} slug={product.slug}
                 category={product.category?.name ?? product.vertical.name} />

        <div>
          <span className={cx(eyebrow, "text-maroon")}>
            {product.category?.name ?? product.vertical.name}
          </span>
          <h1 className="my-1.5 text-h1">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] tracking-[2px] text-gold">{stars(product.ratingAvg)}</span>
              <span className="text-[13.5px] text-muted">
                {product.ratingAvg.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
          )}

          <AddToCart product={product} />
          <PincodeCheck />

          <div className="mt-5 grid grid-cols-3 gap-2.5 border-y border-line py-3.5 text-center">
            {usp.map(([icon, label]) => (
              <div key={label} className="text-[10.5px] font-bold leading-snug text-muted">
                <Icon name={icon} className="mx-auto mb-1.5 h-5 w-5 text-gold-deep" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <Accordion title="Description" defaultOpen>{product.description}</Accordion>

            {spec.some(([, v]) => v) && (
              <Accordion title="Details">
                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
                  {spec.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-xs font-bold text-ink">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
            )}

            <Accordion title="Care">
              {product.careNotes ??
                "Wipe with a dry cloth. Keep away from perfume, water and humidity. Store in the pouch provided. Plated finishes change with wear — this is expected."}
            </Accordion>

            <Accordion title="Shipping & replacement"><PolicyNote /></Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className={cx(section, "border-t border-line")}>
          <SectionHead center rule title="You may also like" />
          <div className="mt-5"><ProductGrid products={related} emptyAction={false} /></div>
        </section>
      )}
    </div>
  );
}
