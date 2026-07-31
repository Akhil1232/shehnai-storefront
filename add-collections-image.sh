#!/usr/bin/env bash
# =============================================================================
# ADD COLLECTION CARD IMAGES
#
#   cd ~/shehnai-storefront
#   sudo bash add-collection-images.sh
#
# Adds a "Collections" screen to the admin so you can upload the image on each
# of the four home page collection cards, instead of it falling back to the
# first product photo in that collection.
#
# The Vertical model already had a bannerUrl field — there was simply no screen
# to edit it. This adds that screen, plus editing for the sub-categories.
#
# Safe to re-run.
# =============================================================================
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$APP_DIR/package.json" ]] || { echo "Run from the project folder."; exit 1; }
[[ $EUID -eq 0 ]] || { echo "Run with sudo."; exit 1; }
OWNER="$(stat -c '%U' "$APP_DIR/package.json")"
cd "$APP_DIR"

G=$'\033[1;32m'; B=$'\033[1;35m'; N=$'\033[0m'
step() { printf "\n${B}[%s/3] %s${N}\n" "$1" "$2"; }
ok()   { printf "  ${G}ok${N}    %s\n" "$1"; }

BK="$APP_DIR/.collections-backup"
mkdir -p "$BK"

step 1 "Backing up and writing files"
for f in "src/app/admin/actions/index.ts" "src/app/admin/layout.tsx"; do
  [[ -f "$f" ]] && { mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; }
done
mkdir -p "src/app/admin/actions"
cat > 'src/app/admin/actions/index.ts' <<'COLL_FILE_END'
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

// -------------------------------------------------------------- collections --

/**
 * The four collections (Men's, Women's, Murti Sringaar, Wedding).
 * `bannerUrl` here is the image on the home page collection card — it is NOT
 * the wide strip on the collection page itself, which is a CATEGORY_HEADER
 * banner. Two different images, two different places.
 */
export async function saveVertical(formData: FormData) {
  await requireAdmin();
  await prisma.vertical.update({
    where: { id: str(formData, "id")! },
    data: {
      name: str(formData, "name")!,
      devName: str(formData, "devName"),
      description: str(formData, "description"),
      bannerUrl: str(formData, "bannerUrl"),
      sortOrder: num(formData, "sortOrder") ?? 0,
      isActive: bool(formData, "isActive"),
    },
  });
  refresh("/admin/collections");
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const data = {
    name: str(formData, "name")!,
    devName: str(formData, "devName"),
    sortOrder: num(formData, "sortOrder") ?? 0,
    isActive: bool(formData, "isActive"),
  };
  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({
      data: {
        ...data,
        slug: str(formData, "slug") ?? slugify(data.name),
        verticalId: str(formData, "verticalId")!,
      },
    });
  }
  refresh("/admin/collections");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const id = String(formData.get("id"));
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    // Deleting would orphan the products, so refuse rather than lose the link.
    throw new Error(`That sub-category still has ${count} product(s). Move them first.`);
  }
  await prisma.category.delete({ where: { id } });
  refresh("/admin/collections");
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
COLL_FILE_END
echo "    wrote src/app/admin/actions/index.ts"
mkdir -p "src/app/admin/collections"
cat > 'src/app/admin/collections/page.tsx' <<'COLL_FILE_END'
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveVertical, saveCategory, deleteCategory } from "../actions";
import { Card, Field, TextArea, Checkbox, SubmitButton } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  await requireAdmin();

  const verticals = await prisma.vertical.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Collections</h1>
      <p className="mb-5 max-w-[70ch] text-[13px] text-[color:var(--muted)]">
        The four collections and their sub-categories. The <b>card image</b> below is
        what appears on the home page under &ldquo;Four houses, one bench&rdquo;. Leave it
        empty and the card falls back to the first product photo in that collection.
      </p>

      {verticals.map((v) => (
        <Card key={v.id} title={`${v.name} · ${v._count.products} products · /collections/${v.slug}`}>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <form action={saveVertical} className="grid gap-3">
              <input type="hidden" name="id" value={v.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" name="name" defaultValue={v.name} required />
                <Field label="Devanagari name" name="devName" defaultValue={v.devName}
                       hint="Shown small under the name on the card." />
              </div>
              <TextArea label="Description" name="description" defaultValue={v.description} rows={2}
                        hint="Appears under the heading on the collection page." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={v.sortOrder}
                       hint="Left to right on the home page." />
                <div className="self-end">
                  <Checkbox label="Visible on the site" name="isActive" defaultChecked={v.isActive} />
                </div>
              </div>
              <ImageUpload
                label="Card image (home page)"
                name="bannerUrl"
                defaultValue={v.bannerUrl}
                spec="800 × 800"
                preset="tile"
              />
              <p className="text-[11.5px] text-[color:var(--muted)]">
                Square. The top ~25% curves away behind the arch — keep it empty.
                This is <b>not</b> the wide strip on the collection page; that is a
                <Link href="/admin/banners" className="mx-1 text-maroon">Collection page banner</Link>.
              </p>
              <div><SubmitButton>Save {v.name}</SubmitButton></div>
            </form>

            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em]">
                Sub-categories ({v.categories.length})
              </h3>
              {v.categories.map((c) => (
                <form key={c.id} action={saveCategory}
                      className="mb-2 rounded border border-[color:var(--line)] p-2.5">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Name" name="name" defaultValue={c.name} />
                    <Field label="Sort" name="sortOrder" type="number" defaultValue={c.sortOrder} />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Checkbox label="Active" name="isActive" defaultChecked={c.isActive} />
                    <SubmitButton>Save</SubmitButton>
                  </div>
                  <p className="mt-1 font-mono text-[10.5px] text-[color:var(--muted)]">{c.slug}</p>
                </form>
              ))}

              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-maroon">
                  + Add a sub-category
                </summary>
                <form action={saveCategory} className="mt-2 grid gap-2 rounded border border-[color:var(--line)] p-2.5">
                  <input type="hidden" name="verticalId" value={v.id} />
                  <Field label="Name" name="name" required />
                  <Field label="Slug" name="slug" hint="Leave blank to generate." />
                  <Field label="Sort order" name="sortOrder" type="number" defaultValue={v.categories.length} />
                  <Checkbox label="Active" name="isActive" defaultChecked />
                  <SubmitButton>Add</SubmitButton>
                </form>
              </details>

              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] text-[color:var(--muted)]">
                  Remove a sub-category
                </summary>
                <div className="mt-2 rounded border border-[color:var(--line)] p-2.5">
                  <p className="mb-2 text-[11.5px] text-[color:var(--muted)]">
                    Only possible once no products are assigned to it.
                  </p>
                  {v.categories.map((c) => (
                    <form key={c.id} action={deleteCategory} className="flex items-center gap-2 py-1">
                      <input type="hidden" name="id" value={c.id} />
                      <span className="text-[12px]">{c.name}</span>
                      <button className="ml-auto text-[11px] text-red-700">Delete</button>
                    </form>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
COLL_FILE_END
echo "    wrote src/app/admin/collections/page.tsx"
mkdir -p "src/app/admin"
cat > 'src/app/admin/layout.tsx' <<'COLL_FILE_END'
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, destroySession } from "@/lib/auth";
import "../globals.css";

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/collections", "Collections"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/banners", "Banners"],
  ["/admin/sections", "Home Sections"],
  ["/admin/reviews", "Reviews"],
  ["/admin/settings", "Settings"],
] as const;

export const metadata = { title: "Shehnai Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The login page renders inside this layout too, so allow it through.
  if (!session) return <html lang="en"><body className="bg-[#F4F1EA]">{children}</body></html>;

  async function signOut() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <html lang="en">
      <body className="bg-[#F4F1EA] font-sans text-ink">
        <div className="flex min-h-screen">
          <aside className="w-[210px] flex-none border-r border-[color:var(--line)] bg-white">
            <div className="border-b border-[color:var(--line)] px-4 py-4">
              <span className="font-serif text-xl">Shehnai®</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Admin</span>
            </div>
            <nav className="py-2">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block px-4 py-2 text-[13px] hover:bg-[#F4F1EA] hover:text-maroon">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-[color:var(--line)] px-4 py-3">
              <p className="text-[12px] font-semibold">{session.name}</p>
              <p className="mb-2 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--muted)]">{session.role}</p>
              <Link href="/" target="_blank" className="block text-[11.5px] text-maroon">View store ↗</Link>
              <form action={signOut}><button className="mt-1 text-[11.5px] text-[color:var(--muted)] hover:text-maroon">Sign out</button></form>
            </div>
          </aside>
          <main className="flex-1 overflow-x-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
COLL_FILE_END
echo "    wrote src/app/admin/layout.tsx"

chown -R "$OWNER:$OWNER" src "$BK"
ok "backup in $BK"

step 2 "Rebuilding"
sudo -u "$OWNER" bash -lc "cd '$APP_DIR' && npx next build"
systemctl restart shehnai
sleep 3
systemctl is-active --quiet shehnai || { journalctl -u shehnai -n 30 --no-pager; exit 1; }
ok "restarted"

step 3 "Done"
cat <<FINAL

  Admin -> Collections  (new item in the sidebar)

  For each of the four collections you can now set:

    Card image        800 x 800 square, uploaded like any product photo.
                      This is the image on the home page under
                      "Four houses, one bench".
                      Top ~25% is hidden behind the arch — keep it empty.

    Name              e.g. Men's
    Devanagari name   shown small under the name on the card
    Description       appears under the heading on the collection page
    Sort order        left-to-right order on the home page
    Visible           hide a whole collection without deleting it

    Sub-categories    rename, reorder, hide, add or remove
                      (removal is blocked while products still use it)

  Leave the card image empty and it still falls back to the first product photo
  in that collection, so a card never renders blank.

  Two different images, easy to mix up:
    Card image             -> Admin -> Collections   (square, home page)
    Collection page strip  -> Admin -> Banners       (wide, 1920x640)

  Undo:  cp -r $BK/src . && rm -rf src/app/admin/collections \\
           && npx next build && sudo systemctl restart shehnai

FINAL
