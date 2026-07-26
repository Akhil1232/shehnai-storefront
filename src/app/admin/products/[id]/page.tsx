import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import {
  saveProduct, deleteProduct, saveVariant, deleteVariant,
  addImage, deleteImage, moveImage,
} from "../../actions";
import { Card, Field, TextArea, Select, Checkbox, ImageField, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [product, verticals] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { isDefault: "desc" } },
      },
    }),
    prisma.vertical.findMany({ orderBy: { sortOrder: "asc" }, include: { categories: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-[11.5px] text-maroon">← Products</Link>
          <h1 className="font-serif text-3xl">{product.name}</h1>
        </div>
        <Link href={`/product/${product.slug}`} target="_blank" className="text-[12px] text-maroon">View on store ↗</Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <div>
          <form action={saveProduct}>
            <input type="hidden" name="id" value={product.id} />
            <Card title="Details">
              <div className="grid gap-3">
                <Field label="Name" name="name" defaultValue={product.name} required />
                <Field label="Slug" name="slug" defaultValue={product.slug} />
                <Field label="Devanagari name" name="devName" defaultValue={product.devName} />
                <TextArea label="Description" name="description" defaultValue={product.description} />
                <TextArea label="Story (long copy, product page)" name="story" defaultValue={product.story} rows={3} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Vertical" name="verticalId" defaultValue={product.verticalId}
                    options={verticals.map((v) => ({ value: v.id, label: v.name }))} />
                  <Select label="Category" name="categoryId" defaultValue={product.categoryId}
                    options={[{ value: "", label: "— none —" },
                      ...verticals.flatMap((v) => v.categories.map((c) => ({ value: c.id, label: `${v.name} › ${c.name}` })))]} />
                </div>
              </div>
            </Card>

            <Card title="Spec sheet">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Material" name="material" defaultValue={product.material} />
                <Field label="Dimensions" name="dimensions" defaultValue={product.dimensions} hint='e.g. "6 × 4.4 cm"' />
                <Field label="Weight (grams)" name="weightGrams" type="number" defaultValue={product.weightGrams} />
                <Field label="Closure" name="closure" defaultValue={product.closure} />
              </div>
              <div className="mt-3"><TextArea label="Care notes" name="careNotes" defaultValue={product.careNotes} rows={2} /></div>
            </Card>

            <Card title="Visibility & SEO">
              <div className="grid gap-3 sm:grid-cols-3">
                <Select label="Status" name="status" defaultValue={product.status}
                  options={["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => ({ value: s, label: s }))} />
                <Select label="Badge" name="badge" defaultValue={product.badge}
                  options={["NONE", "NEW", "BEST", "LIMITED", "SALE"].map((s) => ({ value: s, label: s }))} />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={product.sortOrder} />
              </div>
              <Checkbox label="Show in Bestsellers (featured)" name="isFeatured" defaultChecked={product.isFeatured} />
              <div className="mt-3 grid gap-3">
                <Field label="Meta title" name="metaTitle" defaultValue={product.metaTitle} />
                <Field label="Meta description" name="metaDescription" defaultValue={product.metaDescription} />
              </div>
            </Card>
            <SubmitButton>Save product</SubmitButton>
          </form>

          <Card title="Variants & SKUs">
            {product.variants.map((v) => (
              <form key={v.id} action={saveVariant} className="mb-3 rounded border border-[color:var(--line)] p-3">
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="productId" value={product.id} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="SKU" name="sku" defaultValue={v.sku} required />
                  <Field label="Option name" name="optionName" defaultValue={v.optionName} hint='e.g. "Finish"' />
                  <Field label="Option value" name="optionValue" defaultValue={v.optionValue} hint='e.g. "Antique Gold"' />
                  <Field label="Price (₹)" name="price" type="number" defaultValue={v.pricePaise / 100} />
                  <Field label="MRP (₹)" name="mrp" type="number" defaultValue={v.mrpPaise / 100} />
                  <Field label="Cost (₹)" name="cost" type="number" defaultValue={v.costPaise ? v.costPaise / 100 : ""} />
                  <Field label="Low stock at" name="lowStockAt" type="number" defaultValue={v.lowStockAt} />
                  <Field label="Reorder point" name="reorderPoint" type="number" defaultValue={v.reorderPoint} />
                  <Field label="Supplier / karigar" name="supplier" defaultValue={v.supplier} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox label="Active" name="isActive" defaultChecked={v.isActive} />
                    <span className="text-[12px] text-[color:var(--muted)]">
                      Stock <b className="text-ink">{v.stockQty}</b> · reserved {v.reservedQty} ·{" "}
                      <Link href="/admin/inventory" className="text-maroon">adjust in Inventory</Link>
                    </span>
                  </div>
                  <SubmitButton>Save</SubmitButton>
                </div>
              </form>
            ))}

            <details className="mt-2">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-maroon">+ Add a variant</summary>
              <form action={saveVariant} className="mt-3 grid gap-2 rounded border border-[color:var(--line)] p-3 sm:grid-cols-3">
                <input type="hidden" name="productId" value={product.id} />
                <Field label="SKU" name="sku" required hint="e.g. SHN-MEN-BRC-0043" />
                <Field label="Option name" name="optionName" />
                <Field label="Option value" name="optionValue" />
                <Field label="Price (₹)" name="price" type="number" required />
                <Field label="MRP (₹)" name="mrp" type="number" />
                <Field label="Cost (₹)" name="cost" type="number" />
                <div className="sm:col-span-3"><SubmitButton>Add variant</SubmitButton></div>
              </form>
            </details>
          </Card>
        </div>

        <div>
          <Card title={`Images (${product.images.length})`}>
            <p className="mb-3 rounded bg-[#EFE3CB] px-2 py-1.5 text-[11.5px] text-maroon">
              Required: <b>2000 × 2000</b> (1:1), minimum 1200 × 1200. 4–6 per SKU.
            </p>
            {product.images.map((im, i) => (
              <div key={im.id} className="mb-2 flex gap-2 rounded border border-[color:var(--line)] p-2">
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded bg-neutral-200">
                  <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-[color:var(--muted)]">{im.url}</p>
                  {im.isStudioPhoto && <span className="text-[10px] font-bold uppercase text-maroon">Studio photo</span>}
                  <div className="mt-1 flex gap-1.5">
                    {[-1, 1].map((dir) => (
                      <form key={dir} action={moveImage}>
                        <input type="hidden" name="id" value={im.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="dir" value={dir} />
                        <button className="rounded border border-[color:var(--line)] px-1.5 text-[11px]"
                          disabled={(dir === -1 && i === 0) || (dir === 1 && i === product.images.length - 1)}>
                          {dir === -1 ? "↑" : "↓"}
                        </button>
                      </form>
                    ))}
                    <form action={deleteImage}>
                      <input type="hidden" name="id" value={im.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button className="text-[11px] text-red-700">Remove</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
            <form action={addImage} className="mt-3 grid gap-2 border-t border-[color:var(--line)] pt-3">
              <input type="hidden" name="productId" value={product.id} />
              <ImageField label="Image URL" name="url" spec="2000 × 2000" />
              <Field label="Alt text" name="alt" />
              <Checkbox label="Real studio photograph (not a render)" name="isStudioPhoto" />
              <SubmitButton>Add image</SubmitButton>
            </form>
          </Card>

          <Card title="Danger zone">
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <p className="mb-2 text-[12px] text-[color:var(--muted)]">
                Deletes the product, its variants, images and stock history. Orders keep their
                own snapshot, so invoices stay intact. Prefer setting status to ARCHIVED.
              </p>
              <SubmitButton variant="danger">Delete permanently</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
