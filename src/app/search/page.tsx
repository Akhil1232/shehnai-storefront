import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import { wrap } from "@/lib/styles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const products = term.length >= 2
    ? await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { category: { name: { contains: term, mode: "insensitive" } } },
            { vertical: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        select: cardProductSelect, take: 60,
      })
    : [];

  return (
    <div className={wrap}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <div className="border-b border-line pb-4">
        <h1 className="text-h1">{products.length} result{products.length === 1 ? "" : "s"} for &ldquo;{term}&rdquo;</h1>
      </div>
      <div className="py-5 pb-12">
        {products.length ? <ProductGrid products={products} /> : (
          <EmptyState icon="search" title={`No matches for “${term}”`}
                      body="Check the spelling, or browse by collection instead."
                      action={{ label: "Browse all jewellery", href: "/collections/all" }} />
        )}
      </div>
    </div>
  );
}
