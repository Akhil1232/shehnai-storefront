import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Type-ahead suggestions for the search overlay. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const rows = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { vertical: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: 6,
    select: {
      slug: true, name: true,
      category: { select: { name: true } },
      vertical: { select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      variants: { take: 1, orderBy: { isDefault: "desc" }, select: { pricePaise: true } },
    },
  });

  return NextResponse.json(rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category?.name ?? r.vertical.name,
    pricePaise: r.variants[0]?.pricePaise ?? 0,
    image: r.images[0]?.url ?? null,
  })));
}
