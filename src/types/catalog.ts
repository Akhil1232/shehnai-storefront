import type { Prisma } from "@prisma/client";

/**
 * Shared query shapes. Import these instead of re-declaring `include` blocks —
 * change the shape once here and every consumer's types follow.
 */
export const cardProductSelect = {
  id: true,
  slug: true,
  name: true,
  badge: true,
  ratingAvg: true,
  reviewCount: true,
  vertical: { select: { slug: true, name: true } },
  category: { select: { slug: true, name: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true, isStudioPhoto: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { isDefault: "desc" },
    take: 1,
    select: { id: true, pricePaise: true, mrpPaise: true, stockQty: true, reservedQty: true },
  },
} satisfies Prisma.ProductSelect;

export type CardProduct = Prisma.ProductGetPayload<{ select: typeof cardProductSelect }>;

export const fullProductInclude = {
  vertical: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { isDefault: "desc" } },
  reviews: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 10 },
} satisfies Prisma.ProductInclude;

export type FullProduct = Prisma.ProductGetPayload<{ include: typeof fullProductInclude }>;
