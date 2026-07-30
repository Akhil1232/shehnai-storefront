import { prisma } from "@/lib/prisma";
import { cardProductSelect } from "@/types/catalog";
import WishlistView from "@/components/product/WishlistView";

export const revalidate = 60;
export const metadata = { title: "Saved pieces" };

/** The saved list lives in the browser, so we ship the catalogue and filter client-side. */
export default async function WishlistPage() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" }, select: cardProductSelect, take: 400,
  });
  return <WishlistView products={products} />;
}
