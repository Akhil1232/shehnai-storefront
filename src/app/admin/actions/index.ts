"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { applyStockMovement } from "@/lib/inventory";
import { slugify, buildSku } from "@/lib/slug";
import type { StockReason, Badge, ProductStatus, BannerPlacement } from "@prisma/client";

/**
 * All admin mutations. Every one of them:
 *   1. calls requireAdmin() first,
 *   2. converts rupees from the form into integer paise,
 *   3. revalidates the storefront so changes appear immediately.
 *
 * Stock is never written directly here — it goes through applyStockMovement()
 * so the ledger stays truthful.
 */

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};
const num = (fd: FormData, k: string) => {
  const s = str(fd, k);
  return s === null ? null : Number(s);
};
/** Form fields are in rupees for the human; storage is paise. */
const paise = (fd: FormData, k: string) => {
  const n = num(fd, k);
  return n === null ? null : Math.round(n * 100);
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

function refresh(...paths: string[]) {
  revalidatePath("/");
  revalidatePath("/collections/[vertical]", "page");
  paths.forEach((p) => revalidatePath(p));
}

// ----------------------------------------------------------------- products --

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) throw new Error("Name is required");

  const verticalId = str(formData, "verticalId")!;
  const data = {
    name,
    slug: str(formData, "slug") ?? slugify(name),
    devName: str(formData, "devName"),
    description: str(formData, "description") ?? "",
    story: str(formData, "story"),
    verticalId,
    categoryId: str(formData, "categoryId"),
    material: str(formData, "material"),
    dimensions: str(formData, "dimensions"),
    weightGrams: num(formData, "weightGrams"),
    closure: str(formData, "closure"),
    careNotes: str(formData, "careNotes"),
    status: (str(formData, "status") ?? "DRAFT") as ProductStatus,
    badge: (str(formData, "badge") ?? "NONE") as Badge,
    isFeatured: bool(formData, "isFeatured"),
    sortOrder: num(formData, "sortOrder") ?? 0,
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
  };

  if (id) {
    await prisma.product.update({ where: { id }, data });
    refresh(`/product/${data.slug}`, `/admin/products/${id}`);
    return;
  }

  // New product: create it together with one default variant, because a product
  // with no variant has no price and no stock line and cannot be sold.
  const category = data.categoryId
    ? await prisma.category.findUnique({ where: { id: data.categoryId } })
    : null;
  const vertical = await prisma.vertical.findUniqueOrThrow({ where: { id: verticalId } });
  const seq = (await prisma.productVariant.count()) + 1;

  const created = await prisma.product.create({
    data: {
      ...data,
      variants: {
        create: {
          sku: buildSku(vertical.slug, category?.slug ?? "gen", seq),
          pricePaise: paise(formData, "price") ?? 0,
          mrpPaise: paise(formData, "mrp") ?? 0,
          isDefault: true,
        },
      },
    },
  });
  refresh();
  redirect(`/admin/products/${created.id}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  await prisma.product.delete({ where: { id: String(formData.get("id")) } });
  refresh();
  redirect("/admin/products");
}

// ----------------------------------------------------------------- variants --

export async function saveVariant(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const productId = str(formData, "productId")!;

  const data = {
    sku: str(formData, "sku")!,
    optionName: str(formData, "optionName"),
    optionValue: str(formData, "optionValue"),
    pricePaise: paise(formData, "price") ?? 0,
    mrpPaise: paise(formData, "mrp") ?? 0,
    costPaise: paise(formData, "cost"),
    lowStockAt: num(formData, "lowStockAt") ?? 5,
    reorderPoint: num(formData, "reorderPoint") ?? 10,
    supplier: str(formData, "supplier"),
    barcode: str(formData, "barcode"),
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.productVariant.update({ where: { id }, data });
  } else {
    await prisma.productVariant.create({ data: { ...data, productId } });
  }
  refresh(`/admin/products/${productId}`);
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const id = String(formData.get("id"));
  const productId = String(formData.get("productId"));
  await prisma.productVariant.delete({ where: { id } });
  refresh(`/admin/products/${productId}`);
}

// ------------------------------------------------------------------- images --

export async function addImage(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: {
      productId,
      url: String(formData.get("url")),
      alt: str(formData, "alt") ?? "",
      isStudioPhoto: bool(formData, "isStudioPhoto"),
      sortOrder: count,
    },
  });
  refresh(`/admin/products/${productId}`);
}

export async function deleteImage(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  await prisma.productImage.delete({ where: { id: String(formData.get("id")) } });
  refresh(`/admin/products/${productId}`);
}

export async function moveImage(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const id = String(formData.get("id"));
  const dir = Number(formData.get("dir")); // -1 up, +1 down

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const i = images.findIndex((im) => im.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= images.length) return;

  await prisma.$transaction([
    prisma.productImage.update({ where: { id: images[i].id }, data: { sortOrder: j } }),
    prisma.productImage.update({ where: { id: images[j].id }, data: { sortOrder: i } }),
  ]);
  refresh(`/admin/products/${productId}`);
}

// ---------------------------------------------------------------- inventory --

/** The ONLY way stock changes from the admin. Writes a ledger row every time. */
export async function adjustStock(formData: FormData) {
  const session = await requireAdmin();
  const variantId = String(formData.get("variantId"));
  const mode = String(formData.get("mode")); // "delta" | "set"
  const value = Number(formData.get("value"));
  const reason = String(formData.get("reason")) as StockReason;
  const note = str(formData, "note");

  let delta = value;
  if (mode === "set") {
    const v = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      select: { stockQty: true },
    });
    delta = value - v.stockQty; // a stocktake is expressed as a correction
  }
  if (delta === 0) return;

  await applyStockMovement({
    variantId,
    delta,
    reason,
    note,
    reference: mode === "set" ? "STOCKTAKE" : undefined,
    createdBy: session.email,
  });
  refresh("/admin/inventory");
}

// ------------------------------------------------------------------ banners --

export async function saveBanner(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const data = {
    placement: (str(formData, "placement") ?? "HOME_HERO") as BannerPlacement,
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    desktopUrl: str(formData, "desktopUrl"),
    mobileUrl: str(formData, "mobileUrl"),
    alt: str(formData, "alt") ?? "",
    href: str(formData, "href"),
    ctaLabel: str(formData, "ctaLabel"),
    verticalId: str(formData, "verticalId"),
    sortOrder: num(formData, "sortOrder") ?? 0,
    isActive: bool(formData, "isActive"),
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  refresh("/admin/banners");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id: String(formData.get("id")) } });
  refresh("/admin/banners");
}

// ------------------------------------------------------------ home sections --

export async function saveSection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  // Swatch chips arrive as "Label:#HEX" per line.
  const swatchRaw = str(formData, "swatches");
  const swatches = swatchRaw
    ? swatchRaw.split("\n").map((l) => l.split(":")).filter((p) => p.length >= 2)
        .map(([label, hex]) => ({ label: label.trim(), hex: hex.trim() }))
    : [];

  const minis = (str(formData, "miniUrls") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean);

  await prisma.homeSection.update({
    where: { id },
    data: {
      eyebrow: str(formData, "eyebrow"),
      heading: str(formData, "heading"),
      body: str(formData, "body"),
      ctaLabel: str(formData, "ctaLabel"),
      ctaHref: str(formData, "ctaHref"),
      productId: str(formData, "productId"),
      mediaUrl: str(formData, "mediaUrl"),
      miniUrls: minis,
      config: swatches.length ? { swatches } : undefined,
      reversed: bool(formData, "reversed"),
      sortOrder: num(formData, "sortOrder") ?? 0,
      isActive: bool(formData, "isActive"),
    },
  });
  refresh("/admin/sections");
}

// ------------------------------------------------------------------- orders --

export async function updateOrder(formData: FormData) {
  await requireAdmin();
  const orderNumber = String(formData.get("orderNumber"));
  await prisma.order.update({
    where: { orderNumber },
    data: {
      status: str(formData, "status") as never,
      trackingNumber: str(formData, "trackingNumber"),
      carrier: str(formData, "carrier"),
      notes: str(formData, "notes"),
    },
  });
  refresh(`/admin/orders/${orderNumber}`);
}

// ------------------------------------------------------------------ reviews --

export async function toggleReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const review = await prisma.review.findUniqueOrThrow({ where: { id } });
  await prisma.review.update({
    where: { id },
    data: {
      isPublished: String(formData.get("field")) === "isPublished" ? !review.isPublished : review.isPublished,
      isFeatured: String(formData.get("field")) === "isFeatured" ? !review.isFeatured : review.isFeatured,
    },
  });
  refresh("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  await prisma.review.delete({ where: { id: String(formData.get("id")) } });
  refresh("/admin/reviews");
}

// ----------------------------------------------------------------- settings --

export async function saveSettings(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const entries: Record<string, unknown> = {
    announcement: str(formData, "announcement") ?? "",
    freeShippingThresholdPaise: paise(formData, "freeShippingThreshold") ?? 0,
    flatShippingPaise: paise(formData, "flatShipping") ?? 0,
    codFeePaise: paise(formData, "codFee") ?? 0,
    codEnabled: bool(formData, "codEnabled"),
    supportEmail: str(formData, "supportEmail") ?? "",
    supportPhone: str(formData, "supportPhone") ?? "",
    whatsapp: str(formData, "whatsapp") ?? "",
    instagram: str(formData, "instagram") ?? "",
  };
  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }
  refresh("/admin/settings");
}

// ------------------------------------------------------------- CSV import ---

/**
 * Bulk stock update. One row per SKU: `sku,counted_qty`.
 * Treated as a stocktake — each row becomes a correcting ledger movement.
 * This is how you reconcile 300 SKUs without 300 clicks.
 */
export async function importStockCsv(formData: FormData) {
  const session = await requireAdmin();
  const csv = String(formData.get("csv") ?? "");
  const rows = csv.split("\n").map((r) => r.trim()).filter(Boolean);

  let applied = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const [sku, qtyRaw] = row.split(",").map((c) => c.trim());
    if (!sku || sku.toLowerCase() === "sku") continue; // skip header
    const counted = Number(qtyRaw);
    if (!Number.isFinite(counted) || counted < 0) {
      errors.push(`Line ${i + 1}: bad quantity "${qtyRaw}"`);
      continue;
    }
    const variant = await prisma.productVariant.findUnique({
      where: { sku },
      select: { id: true, stockQty: true },
    });
    if (!variant) {
      errors.push(`Line ${i + 1}: unknown SKU ${sku}`);
      continue;
    }
    const delta = counted - variant.stockQty;
    if (delta === 0) continue;
    await applyStockMovement({
      variantId: variant.id,
      delta,
      reason: "STOCKTAKE",
      reference: `CSV-${new Date().toISOString().slice(0, 10)}`,
      note: `Counted ${counted}, system had ${variant.stockQty}`,
      createdBy: session.email,
    });
    applied++;
  }

  refresh("/admin/inventory");
  redirect(
    `/admin/inventory?applied=${applied}&errors=${encodeURIComponent(errors.slice(0, 5).join(" · "))}`
  );
}
